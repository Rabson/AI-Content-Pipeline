variable "aws_region" {
  type        = string
  description = "AWS region used for the storage bucket and IAM credentials."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Base project name."
  default     = "ai-content-pipeline"
}

variable "environment" {
  type        = string
  description = "Deployment environment label, for example local, staging, or production."
  default     = "staging"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags applied to managed AWS resources."
  default     = {}
}

variable "enable_asset_bucket" {
  type        = bool
  description = "Create the content asset bucket."
  default     = true
}

variable "asset_bucket_name_override" {
  type        = string
  description = "Optional explicit bucket name override."
  default     = null
  nullable    = true
}

variable "asset_bucket_force_destroy" {
  type        = bool
  description = "Allow Terraform to destroy the bucket even when it contains objects."
  default     = false
}

variable "asset_bucket_versioning_enabled" {
  type        = bool
  description = "Enable versioning on the asset bucket."
  default     = true
}

variable "create_asset_bucket_user" {
  type        = bool
  description = "Create a least-privilege IAM user and access key for the publisher/storage runtime."
  default     = true
}
