from pathlib import Path
import re
p=Path('supabase/config.toml')
s=p.read_text()
s=s.replace('# [auth.captcha]\n# enabled = true\n# provider = "hcaptcha"\n# secret = ""','[auth.captcha]\nenabled = true\nprovider = "turnstile"\nsecret = "1x0000000000000000000000000000000AA"')
s=s.replace('site_url = "http://127.0.0.1:3000"','site_url = "http://localhost:3000"')
s=s.replace('additional_redirect_urls = ["https://127.0.0.1:3000"]','additional_redirect_urls = ["http://localhost:3000/**"]')
s=re.sub(r'(\[auth.email\][\s\S]*?enable_confirmations = )false',r'\g<1>true',s,count=1)
assert '[auth.captcha]\nenabled = true' in s
assert re.search(r'\[auth.email\][\s\S]*?enable_confirmations = true',s)
p.write_text(s)
