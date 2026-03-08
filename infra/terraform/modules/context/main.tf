locals {
  default_tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }

  merged_tags = merge(local.default_tags, var.tags)
}
