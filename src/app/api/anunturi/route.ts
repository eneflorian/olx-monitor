import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'anunturi-olx-sibiu.json');
    
    // Verifică dacă fișierul există
    if (!fs.existsSync(filePath)) {
      console.log('Fișierul de anunțuri nu există încă');
      return NextResponse.json([]);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Returnează doar anunțurile din structura nouă
    return NextResponse.json(data.anunturi || []);
  } catch (error) {
    console.error('Eroare la citirea anunțurilor:', error);
    return NextResponse.json({ error: 'Nu s-au putut încărca anunțurile' }, { status: 500 });
  }
} 