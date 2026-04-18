# Edit all values below, then run: terraform init && terraform apply

aws_region = "ap-south-1"

# Must be globally unique across all AWS accounts
bucket_name = "campusplacement-docs-prod-ap-south-1"

# Browser origins allowed to upload (presigned PUT). No trailing slash.
allowed_origins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://campus-placement-omega.vercel.app",
]

iam_user_name = "placementhub-s3-uploader"

# App stores keys under students/<userId>/... — keep default unless you change src/lib/s3.js
student_documents_prefix = "students"

cors_allowed_headers = ["*"]
# Include POST for compatibility with some clients / preflight patterns
cors_allowed_methods = ["PUT", "GET", "HEAD", "POST"]
cors_expose_headers  = ["ETag"]
cors_max_age_seconds = 3000

# Allow browser <img> / open-in-new-tab for keys under students/* (see main.tf bucket policy).
# Set false only if you will serve files via presigned GET or CloudFront instead.
enable_public_read_for_student_objects = true

# Set true only in dev if you want terraform destroy to empty the bucket
bucket_force_destroy = false

create_iam_user = true

tags = {
  Environment = "prod"
  App         = "PlacementHub"
}
