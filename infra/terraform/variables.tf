variable "aws_region" {
  type        = string
  description = "AWS region or S3-compatible pseudo-region for storage"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Base project name"
  default     = "ai-content-pipeline"
}
