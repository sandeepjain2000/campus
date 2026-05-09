output "bucket_id" {
  description = "S3 bucket name (same as S3_BUCKET_NAME)"
  value       = aws_s3_bucket.documents.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.documents.arn
}

output "aws_region" {
  description = "Set AWS_REGION in .env.local to this value"
  value       = var.aws_region
}

output "iam_user_name" {
  description = "IAM user for application credentials (if create_iam_user = true)"
  value       = var.create_iam_user ? aws_iam_user.app_s3[0].name : null
}

output "access_key_id" {
  description = "AWS_ACCESS_KEY_ID for .env.local (sensitive in Terraform state)"
  value       = var.create_iam_user ? aws_iam_access_key.app_s3[0].id : null
}

output "secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY for .env.local — copy once; stored in state"
  value       = var.create_iam_user ? aws_iam_access_key.app_s3[0].secret : null
  sensitive   = true
}

output "env_snippet" {
  description = "Paste into campus-placement/.env.local (replace secret from sensitive output)"
  value = var.create_iam_user ? join("\n", [
    "AWS_REGION=${var.aws_region}",
    "AWS_ACCESS_KEY_ID=${aws_iam_access_key.app_s3[0].id}",
    "AWS_SECRET_ACCESS_KEY=<run: terraform output -raw secret_access_key>",
    "S3_BUCKET_NAME=${var.bucket_name}",
  ]) : "Set create_iam_user = true to generate keys, or attach policy document to your user."
}

output "iam_policy_json" {
  description = "Standalone policy JSON if create_iam_user is false"
  value       = data.aws_iam_policy_document.app_s3_put.json
}
