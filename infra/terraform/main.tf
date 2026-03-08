module "context" {
  source = "./modules/context"

  project_name = var.project_name
  environment  = var.environment
  tags         = var.tags
}

module "content_assets" {
  count  = var.enable_asset_bucket ? 1 : 0
  source = "./modules/storage_bucket"

  bucket_name          = coalesce(var.asset_bucket_name_override, "${var.project_name}-${var.environment}-assets")
  force_destroy        = var.asset_bucket_force_destroy
  versioning_enabled   = var.asset_bucket_versioning_enabled
  attach_public_policy = false
  tags                 = module.context.tags
}

module "asset_bucket_user" {
  count  = var.enable_asset_bucket && var.create_asset_bucket_user ? 1 : 0
  source = "./modules/storage_iam_user"

  user_name  = "${var.project_name}-${var.environment}-publisher"
  bucket_arn = module.content_assets[0].bucket_arn
  tags       = module.context.tags
}
