import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  try {
    const statsPath = 'src/data/statistici-olx.json';
    
    if (!fs.existsSync(statsPath)) {
      return NextResponse.json({
        total: 0,
        noi: 0,
        ultimaActualizare: null
      });
    }

    const statsData = fs.readFileSync(statsPath, 'utf8');
    const stats = JSON.parse(statsData);
    
    return NextResponse.json({
      total: stats.total || 0,
      noi: stats.noi || 0,
      ultimaActualizare: stats.ultimaActualizare || null
    });

  } catch (error) {
    console.error('Eroare la citirea statisticilor:', error);
    return NextResponse.json({
      total: 0,
      noi: 0,
      ultimaActualizare: null
    });
  }
} 