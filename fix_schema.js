const fs = require('fs');
const path = require('path');

const filePath = path.join('e:', 'salonos', 'salonOS', 'supabase', 'schema.sql');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/create policy if not exists\s+(".*?")\s+on\s+(public\.[a-z_]+)/g, 'drop policy if exists $1 on $2;\ncreate policy $1 on $2');

fs.writeFileSync(filePath, content);
console.log('Fixed schema.sql');
