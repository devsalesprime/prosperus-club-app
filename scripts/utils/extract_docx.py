import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_docx(path, output):
    z = zipfile.ZipFile(path)
    root = ET.parse(z.open('word/document.xml')).getroot()
    ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    lines = [t.text for t in root.iter('{' + ns + '}t') if t.text]
    with open(output, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'OK: {len(lines)} text nodes extracted')

extract_docx(
    'c:/xampp/htdocs/prosperus-club-app/PRD_Complementar_Prosperus_v2.1.docx',
    'c:/xampp/htdocs/prosperus-club-app/docs/PRD_Complementar_temp.txt'
)
