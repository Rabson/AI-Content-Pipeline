data "aws_iam_policy_document" "bucket_access" {
  statement {
    sid    = "ListBucket"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [var.bucket_arn]
  }

  statement {
    sid    = "ObjectAccess"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
      "s3:ListBucketMultipartUploads",
      "s3:ListMultipartUploadParts",
    ]

    resources = ["${var.bucket_arn}/*"]
  }
}

resource "aws_iam_user" "this" {
  name = var.user_name
  tags = var.tags
}

resource "aws_iam_user_policy" "this" {
  name   = "${var.user_name}-storage-access"
  user   = aws_iam_user.this.name
  policy = data.aws_iam_policy_document.bucket_access.json
}

resource "aws_iam_access_key" "this" {
  user = aws_iam_user.this.name
}
