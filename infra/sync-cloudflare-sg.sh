#!/usr/bin/env bash
# sync-cloudflare-sg.sh
# Fetches Cloudflare's current IP ranges and updates an AWS Security Group
# to allow only those IPs on ports 80 and 443.
#
# Prerequisites:
#   aws cli v2 configured with credentials
#   jq installed
#
# Usage:
#   SG_ID=sg-xxxxxxxxxxxxxxxxx ./sync-cloudflare-sg.sh

set -euo pipefail

SG_ID="${SG_ID:?Set SG_ID to your ALB security group ID}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

echo "Fetching Cloudflare IP ranges..."
CF_IPS_V4=$(curl -sf https://www.cloudflare.com/ips-v4)
CF_IPS_V6=$(curl -sf https://www.cloudflare.com/ips-v6)

echo "Revoking all existing inbound rules on $SG_ID..."
EXISTING=$(aws ec2 describe-security-groups \
  --group-ids "$SG_ID" \
  --region "$REGION" \
  --query 'SecurityGroups[0].IpPermissions' \
  --output json)

if [ "$EXISTING" != "[]" ]; then
  aws ec2 revoke-security-group-ingress \
    --group-id "$SG_ID" \
    --region "$REGION" \
    --ip-permissions "$EXISTING"
fi

echo "Adding Cloudflare IPv4 ranges for ports 80 and 443..."
for CIDR in $CF_IPS_V4; do
  for PORT in 80 443; do
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --region "$REGION" \
      --protocol tcp \
      --port "$PORT" \
      --cidr "$CIDR" \
      --no-cli-pager 2>/dev/null || true
  done
done

echo "Adding Cloudflare IPv6 ranges for ports 80 and 443..."
for CIDR in $CF_IPS_V6; do
  for PORT in 80 443; do
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --region "$REGION" \
      --protocol tcp \
      --port "$PORT" \
      --ipv6-cidr "$CIDR" \
      --no-cli-pager 2>/dev/null || true
  done
done

echo "Done. Security group $SG_ID now only accepts traffic from Cloudflare."
echo ""
echo "Verify with:"
echo "  aws ec2 describe-security-groups --group-ids $SG_ID --region $REGION"
