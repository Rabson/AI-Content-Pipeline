resource "aws_s3_bucket" "content_assets" {
  bucket = "${var.project_name}-assets"
}
