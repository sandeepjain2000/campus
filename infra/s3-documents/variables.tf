variable "aws_region" {
  type        = string
  description = "Must match AWS_REGION in campus-placement .env.local"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name; must match S3_BUCKET_NAME in .env.local"
}

variable "allowed_origins" {
  type        = list(string)
  description = "Browser origins allowed to PUT (and GET/HEAD) via CORS — include localhost and production URLs"
}

variable "iam_user_name" {
  type        = string
  description = "IAM user that owns access keys for the Next.js server (presigned PUT)"
}

variable "student_documents_prefix" {
  type        = string
  description = "Key prefix for student uploads; IAM PutObject is scoped to this prefix. Must match app (students/)"
  default     = "students"
}

variable "cors_allowed_headers" {
  type        = list(string)
  description = "S3 CORS AllowedHeaders"
  default     = ["*"]
}

variable "cors_allowed_methods" {
  type        = list(string)
  description = "S3 CORS AllowedMethods"
  default     = ["PUT", "GET", "HEAD", "POST"]
}

variable "cors_expose_headers" {
  type        = list(string)
  description = "S3 CORS ExposeHeaders"
  default     = ["ETag"]
}

variable "cors_max_age_seconds" {
  type        = number
  description = "S3 CORS MaxAgeSeconds"
  default     = 3000
}

variable "enable_public_read_for_student_objects" {
  type        = bool
  description = "If true, anonymous s3:GetObject is allowed on student_documents_prefix/* so <img> and direct links work (matches buildS3ObjectPublicUrl in the app). If false, bucket stays fully private — you must add presigned GET or CloudFront yourself."
  default     = true
}

variable "bucket_force_destroy" {
  type        = bool
  description = "If true, terraform destroy can empty the bucket first (use only in non-prod)"
  default     = false
}

variable "create_iam_user" {
  type        = bool
  description = "If false, skip IAM user and access key; attach aws_iam_user_policy_document output to your own user"
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Tags for bucket and IAM resources"
  default     = {}
}
