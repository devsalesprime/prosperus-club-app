const fs = require('fs');

const files = [
    'components/admin/AnalyticsDashboard.tsx',
    'pages/ProgressListPage.tsx',
    'components/admin/AdminMemberProgress.tsx'
];

files.forEach(file => {
    if(!fs.existsSync(file)) {
        console.log('Skipping missing file:', file);
        return;
    }
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // 1. Add min-w-0 to flex-1
    content = content.replace(/flex-1(?![A-Za-z0-9\-_])/g, 'flex-1 min-w-0');
    // Normalize duplicates
    content = content.replace(/flex-1 min-w-0 min-w-0/g, 'flex-1 min-w-0');
    
    // 2. Ensure inputs and selects have w-full and box-border
    content = content.replace(/<input([^>]*?)className="([^"]*?)"/g, (match, prefix, className) => {
        let newClass = className;
        if(!newClass.includes('w-full')) newClass += ' w-full';
        if(!newClass.includes('box-border')) newClass += ' box-border';
        return '<input' + prefix + 'className="' + newClass + '"';
    });
    
    content = content.replace(/<select([^>]*?)className="([^"]*?)"/g, (match, prefix, className) => {
        let newClass = className;
        if(!newClass.includes('w-full')) newClass += ' w-full';
        if(!newClass.includes('box-border')) newClass += ' box-border';
        return '<select' + prefix + 'className="' + newClass + '"';
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed overflow in:', file);
    }
});
