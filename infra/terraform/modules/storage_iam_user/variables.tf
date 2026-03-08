variable "user_name" {
  type        = string
  description = "IAM user name."
}

variable "bucket_arn" {
  type        = string
  description = "Target bucket ARN."
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}
