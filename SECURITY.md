# Security Policy

This repository is maintained by **Nexus Communications Technology** (Nexuscomm LLC).

## Reporting a Security Vulnerability

If you discover a security vulnerability, **do not** open a public issue.

Instead, email **office@nexusct.com** with:
- A description of the vulnerability
- Steps to reproduce (if applicable)
- The commit/branch where you observed it
- Your assessment of severity and impact

We will acknowledge your report within 2 business days and provide a timeline for remediation.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 0.0.1 | :x:                |

Security patches are applied to the `main` branch and released as new minor/patch versions.

## Security Best Practices

### What Never Belongs in This Repository

**Never commit:**
- Passwords, API keys, tokens, private keys, certificates
- Internal pricing data, dealer costs, margin percentages
- Customer PII (Personally Identifiable Information) or PHI (Protected Health Information)
- Internal network addresses or credentials
- Database dumps or backups containing real data
- Production environment variables or configuration files with secrets

**Always use:**
- Environment variables for all secrets (e.g., `GOOGLE_MAPS_API_KEY`)
- Cloudflare Workers secrets for production deployments
- `config.local.js` (gitignored) for local development secrets
- Separate development/staging/production key rotation

### Pre-commit Hooks

This repository uses [pre-commit](https://pre-commit.com/) hooks to prevent security incidents:

**Setup (one-time per machine):**

```bash
pip install pre-commit
```

**Setup (one-time per repository clone):**

```bash
cd /path/to/nexus-emdash
pre-commit install
```

**What the hooks do:**
- `gitleaks` — Detects over 100 types of hardcoded secrets
- `detect-secrets` — Second-layer scanner with Nexus baseline
- Nexus-specific pattern blocks — Rejects known-bad strings from past incidents
- File hygiene checks — Prevents large files, merge conflicts, trailing whitespace

**Manual scan (before important pushes):**

```bash
pre-commit run --all-files
```

Hooks run automatically on every `git commit`. If blocked, fix the issue before committing.

### API Key Management

**For Google Maps, Cloudflare, or other API keys:**

1. **Never hardcode keys** in source code
2. **Use environment variables**:
   ```bash
   # Local development (.env - gitignored)
   GOOGLE_MAPS_API_KEY=your_key_here
   
   # Production (Cloudflare Workers)
   wrangler secret put GOOGLE_MAPS_API_KEY
   ```
3. **Restrict API keys** in the provider console:
   - Enable HTTP referrer restrictions (e.g., `*.yourdomain.com/*`)
   - Enable API quotas and rate limits
   - Use separate keys for dev/staging/production
4. **Rotate keys** immediately if exposed
5. **Monitor usage** for anomalies

### Dependency Security

**Automated scanning:**
- GitHub Dependabot alerts enabled
- `npm audit` runs in CI/CD pipeline

**Manual checks:**

```bash
# Check for vulnerabilities
npm audit

# Fix non-breaking issues
npm audit fix

# Review breaking changes before applying
npm audit fix --force
```

**Update strategy:**
- Security patches applied within 7 days
- Non-critical updates reviewed monthly
- Major version upgrades tested in staging first

### Content Security Policy (CSP)

**Recommended for production** (add to Cloudflare Workers middleware):

```javascript
// Example CSP headers for enhanced XSS protection
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

// Add to response headers
response.headers.set("Content-Security-Policy", cspHeader);
```

### Access Control

**Admin panel security:**
- Admin UI is at `/_emdash/admin` (not publicly advertised)
- Authentication handled by EmDash framework (session-based)
- Consider IP allowlisting for admin access via Cloudflare WAF
- Enable 2FA for Cloudflare account

**Recommended Cloudflare settings:**
- Enable Bot Fight Mode
- Configure WAF rules for admin paths
- Enable rate limiting on API endpoints
- Use Cloudflare Access for team member authentication

### Secure Development Practices

**Code review checklist:**
- [ ] No hardcoded credentials or API keys
- [ ] No `dangerouslySetInnerHTML` or direct HTML injection
- [ ] User input is sanitized before output
- [ ] SQL queries use parameterized statements (handled by Kysely)
- [ ] File uploads validate type and size
- [ ] Error messages don't leak sensitive information
- [ ] Authentication checks on protected routes

**Testing:**
- Run pre-commit hooks before pushing (`pre-commit run --all-files`)
- Test with `npm audit` before deploying
- Verify environment variables are set in production
- Test in staging environment first

## Incident History

### 2026-04-19: Credential Exposure (NCT-SEC-2026-04-19-001)

**What happened:**
- Google Maps API key was committed to the repository
- Key was visible in git history
- Pre-commit hook was added but initially contained the rotated key as a literal string

**Resolution:**
- API key rotated immediately (2026-04-19)
- Pre-commit hooks deployed to all repositories
- Hardcoded key removed from hook (2026-07-29)
- `.gitignore` hardened to block credentials
- `SECURITY.md` created with reporting process
- Incident report filed internally

**Lessons learned:**
1. Pre-commit hooks should use patterns, not literal values
2. Security tooling must be reviewed as carefully as production code
3. Git history remains a risk even after fixes (consider BFG or filter-repo for sensitive repos)

**Current status:**
- ✅ Key rotated and restricted in Google Cloud Console
- ✅ No keys in current codebase
- ⚠️ Key visible in git history (commits before 2026-07-29)

### 2026-08-15: Security Review Completed

**Findings:**
- XSS vulnerabilities in Astro dependencies (CVE-2026-54298, GHSA-f48w-9m4c-m7f5)
- Spread attributes in Astro templates created XSS vector
- 7 high/moderate npm vulnerabilities in dependencies

**Resolution:**
- Astro upgraded to 7.2.2 (fixes XSS issues)
- Spread attributes removed from templates
- Transitive dependencies updated (esbuild, sharp)
- Documentation improved (README, SECURITY.md, SECURITY_NOTES.md)

**Remaining risks:**
- Upstream EmDash dependencies (image-size, kysely) have unpatched vulnerabilities
- Risk assessed as LOW for typical blog usage
- Monitor EmDash releases for updates

See [SECURITY_NOTES.md](SECURITY_NOTES.md) for detailed findings.

## Security Resources

**Internal:**
- [SECURITY_NOTES.md](SECURITY_NOTES.md) - Detailed security review findings
- [.pre-commit-config.yaml](.pre-commit-config.yaml) - Pre-commit hook configuration
- [.gitignore](.gitignore) - Gitignore rules including security patterns

**External:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [EmDash CMS Security](https://github.com/emdash-cms/emdash/security)
- [pre-commit framework](https://pre-commit.com/)
- [gitleaks documentation](https://github.com/gitleaks/gitleaks)

## Compliance

This project follows:
- OWASP secure coding guidelines
- Nexus Communications Technology security baseline
- Cloudflare Workers security best practices

For compliance inquiries, contact: office@nexusct.com

---

**Last Updated**: August 15, 2026  
**Maintained By**: Nexus Communications Technology  
**Security Contact**: office@nexusct.com

