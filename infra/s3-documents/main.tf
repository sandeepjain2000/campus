provider "aws" {
  region = var.aws_region
}

locals {
  prefix_pattern = trim(var.student_documents_prefix, "/")
  # IAM resource ARN: prefix/* (app uses keys like students/<userId>/...)
  objects_arn = "${aws_s3_bucket.documents.arn}/${local.prefix_pattern}/*"
  default_tags = merge(
    {
      Project   = "campus-placement"
      ManagedBy = "terraform"
    },
    var.tags,
  )
}

resource "aws_s3_bucket" "documents" {
  bucket        = var.bucket_name
  force_destroy = var.bucket_force_destroy

  tags = local.default_tags
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  # Never use object ACLs for public read; use bucket policy on the prefix instead.
  block_public_acls  = true
  ignore_public_acls = true
  # Allow a public *bucket policy* only when we intentionally expose student/* for GET.
  block_public_policy     = !var.enable_public_read_for_student_objects
  restrict_public_buckets = !var.enable_public_read_for_student_objects
}

data "aws_iam_policy_document" "student_objects_public_read" {
  count = var.enable_public_read_for_student_objects ? 1 : 0

  statement {
    sid    = "PublicReadStudentObjects"
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.documents.arn}/${local.prefix_pattern}/*"]
  }
}

resource "aws_s3_bucket_policy" "student_objects_public_read" {
  count  = var.enable_public_read_for_student_objects ? 1 : 0
  bucket = aws_s3_bucket.documents.id
  policy = data.aws_iam_policy_document.student_objects_public_read[0].json
}

resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = var.cors_allowed_headers
    allowed_methods = var.cors_allowed_methods
    allowed_origins = var.allowed_origins
    expose_headers  = var.cors_expose_headers
    max_age_seconds = var.cors_max_age_seconds
  }
}

data "aws_iam_policy_document" "app_s3_put" {
  statement {
    sid    = "StudentDocumentsPut"
    effect = "Allow"
    actions = [
      "s3:PutObject",
    ]
    resources = [local.objects_arn]
  }
}

resource "aws_iam_user" "app_s3" {
  count = var.create_iam_user ? 1 : 0
  name  = var.iam_user_name
  tags  = local.default_tags
}

resource "aws_iam_user_policy" "app_s3_put" {
  count  = var.create_iam_user ? 1 : 0
  name   = "${var.iam_user_name}-s3-student-documents-put"
  user   = aws_iam_user.app_s3[0].name
  policy = data.aws_iam_policy_document.app_s3_put.json
}

resource "aws_iam_access_key" "app_s3" {
  count = var.create_iam_user ? 1 : 0
  user  = aws_iam_user.app_s3[0].name
}
