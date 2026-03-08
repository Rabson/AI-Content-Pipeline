output "asset_bucket_name" {
  value = var.enable_asset_bucket ? module.content_assets[0].bucket_name : null
}

output "asset_bucket_arn" {
  value = var.enable_asset_bucket ? module.content_assets[0].bucket_arn : null
}

output "asset_bucket_region" {
  value = var.enable_asset_bucket ? module.content_assets[0].bucket_region : null
}

output "publisher_user_name" {
  value = var.enable_asset_bucket && var.create_asset_bucket_user ? module.asset_bucket_user[0].user_name : null
}

output "publisher_access_key_id" {
  value     = var.enable_asset_bucket && var.create_asset_bucket_user ? module.asset_bucket_user[0].access_key_id : null
  sensitive = true
}

output "publisher_secret_access_key" {
  value     = var.enable_asset_bucket && var.create_asset_bucket_user ? module.asset_bucket_user[0].secret_access_key : null
  sensitive = true
}
