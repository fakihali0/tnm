# Security Headers Configuration Guide

This file provides configuration examples for implementing security headers across different deployment platforms.

## 🔒 Vercel Deployment

Create or update `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://s3.tradingview.com https://www.tradingview-widget.com; style-src 'self' https://fonts.googleapis.com 'sha256-PsZll6aHYAIASf03JEonE23Kv5v8ElkuGjBGBwZ929Q=' 'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8='; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://edzkorfdixvvvrkfzqzg.supabase.co https://s3.tradingview.com https://www.tradingview-widget.com wss:; frame-src https://www.tradingview-widget.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), location=(), payment-method=(), usb=(), midi=(), sync-xhr=(), picture-in-picture=()"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 🔒 Netlify Deployment

Create `public/_headers`:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' https://s3.tradingview.com https://www.tradingview-widget.com; style-src 'self' https://fonts.googleapis.com 'sha256-PsZll6aHYAIASf03JEonE23Kv5v8ElkuGjBGBwZ929Q=' 'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8='; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://edzkorfdixvvvrkfzqzg.supabase.co https://s3.tradingview.com https://www.tradingview-widget.com wss:; frame-src https://www.tradingview-widget.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), location=(), payment-method=(), usb=(), midi=(), sync-xhr=(), picture-in-picture=()
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
```

## 🔒 Apache Server

Add to `.htaccess`:

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://s3.tradingview.com https://www.tradingview-widget.com; style-src 'self' https://fonts.googleapis.com 'sha256-PsZll6aHYAIASf03JEonE23Kv5v8ElkuGjBGBwZ929Q=' 'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8='; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://edzkorfdixvvvrkfzqzg.supabase.co https://s3.tradingview.com https://www.tradingview-widget.com wss:; frame-src https://www.tradingview-widget.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), location=(), payment-method=(), usb=(), midi=(), sync-xhr=(), picture-in-picture=()"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set X-XSS-Protection "1; mode=block"
```

## 🔒 Nginx Server

Add to server block:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://s3.tradingview.com https://www.tradingview-widget.com; style-src 'self' https://fonts.googleapis.com 'sha256-PsZll6aHYAIASf03JEonE23Kv5v8ElkuGjBGBwZ929Q=' 'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8='; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://edzkorfdixvvvrkfzqzg.supabase.co https://s3.tradingview.com https://www.tradingview-widget.com wss:; frame-src https://www.tradingview-widget.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), location=(), payment-method=(), usb=(), midi=(), sync-xhr=(), picture-in-picture=()" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 🛡️ Security Testing

After implementing headers, test your configuration:

1. **Security Headers Checker**: https://securityheaders.com/
2. **Mozilla Observatory**: https://observatory.mozilla.org/
3. **CSP Evaluator**: https://csp-evaluator.withgoogle.com/

## 📊 Expected Security Grades

After implementation:
- **SecurityHeaders.com**: A+ grade
- **Mozilla Observatory**: A+ grade  
- **CSP Evaluator**: No high-risk findings

## 🔧 Troubleshooting

### Common Issues:

1. **TradingView widgets not loading**: Ensure script-src includes TradingView domains
2. **Font loading issues**: Verify font-src includes Google Fonts domains
3. **CSP violations**: Check browser console for specific violations

### CSP Hash Updates:

If you modify inline styles, update the sha256 hashes in style-src:

```bash
# Generate new hash for inline styles
echo -n "your-inline-style-content" | openssl dgst -sha256 -binary | openssl base64
```

## 🚀 Deployment Checklist

- [ ] Configure security headers for your platform
- [ ] Test all TradingView widgets load correctly
- [ ] Verify fonts load from Google Fonts
- [ ] Check CSP compliance in browser console
- [ ] Test site functionality with strict headers
- [ ] Run security header analysis tools
- [ ] Monitor for any CSP violations in production