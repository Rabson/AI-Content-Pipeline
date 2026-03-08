variable "bucket_name" {
  type        = string
  description = "S3 bucket name."
}

variable "force_destroy" {
  type        = bool
  description = "Allow destroy of non-empty buckets."
  default     = false
}

variable "versioning_enabled" {
  type        = bool
  description = "Enable S3 versioning."
  default     = true
}

variable "attach_public_policy" {
  type        = bool
  description = "If true, allow public bucket policies."
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}
