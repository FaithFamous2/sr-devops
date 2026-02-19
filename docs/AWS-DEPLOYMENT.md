# AWS EC2 Deployment Guide

This guide explains how to deploy Secure Drop on an AWS EC2 instance.

## Prerequisites

1. **AWS EC2 Instance** (Ubuntu 22.04 LTS recommended)
   - t3.small or larger (minimum 2GB RAM)
   - Security group allowing ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Domain (Optional)** - For SSL/HTTPS
   - Point your domain's A record to your EC2 public IP

## Step 1: Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## Step 2: Install Docker

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Logout and login again for group changes to take effect
exit
```

## Step 3: Clone/Copy Project Files

**Option A: Clone from GitHub**
```bash
git clone https://github.com/YOUR_USERNAME/secure-drop.git
cd secure-drop/sr-devops
```

**Option B: Copy files via SCP**
```bash
# On your local machine:
scp -i your-key.pem -r sr-devops ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/secure-drop
```

## Step 4: Deploy

### Option A: Quick Deploy (IP-based, HTTP)

```bash
cd /home/ubuntu/secure-drop
chmod +x deploy.sh
./deploy.sh
```

Your app will be available at: `http://YOUR_EC2_PUBLIC_IP`

### Option B: Deploy with Domain (HTTPS)

```bash
cd /home/ubuntu/secure-drop
chmod +x deploy.sh
DOMAIN=your-domain.com ACME_EMAIL=your-email@example.com ./deploy.sh
```

Your app will be available at: `https://your-domain.com`

## Step 5: Verify Deployment

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f

# Test API
curl http://localhost/api/health
```

## Common Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Rebuild and restart
docker compose up -d --build

# Run migrations
docker compose exec api php artisan migrate --force
```

## Troubleshooting

### Port 80/443 not accessible
- Check AWS Security Group rules
- Ensure ports 80 and 443 are allowed inbound

### SSL Certificate Issues
- Ensure your domain's A record points to your EC2 IP
- Check Traefik logs: `docker compose logs traefik`

### Database Issues
```bash
# Reset database
docker compose exec api php artisan migrate:fresh --force
```

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Backup

The SQLite database is stored in a Docker volume. To backup:

```bash
# Export database
docker compose exec api cat /var/www/html/database/database.sqlite > backup.sql

# Or copy the entire volume
docker run --rm -v sr-devops_api-database:/data -v $(pwd):/backup alpine cp -r /data /backup/
```
