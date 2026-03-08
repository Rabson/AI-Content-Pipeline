output "user_name" {
  value = aws_iam_user.this.name
}

output "access_key_id" {
  value     = aws_iam_access_key.this.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.this.secret
  sensitive = true
}
