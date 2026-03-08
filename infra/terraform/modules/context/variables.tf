variable "project_name" {
  type        = string
  description = "Base project name."
}

variable "environment" {
  type        = string
  description = "Deployment environment label."
}

variable "tags" {
  type        = map(string)
  description = "Additional tags."
  default     = {}
}
