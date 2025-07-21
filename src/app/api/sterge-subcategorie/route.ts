import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subcategorie } = body;

    if (!subcategorie) {
      return NextResponse.json(
        { error: 'Subcategoria este obligatorie' },
        { status: 400 }
      );
    }

    const dataPath = 'src/data/anunturi-olx-sibiu.json';
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Fișierul de date nu există' },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const initialCount = data.anunturi.length;
    
    // Filtrează anunțurile, eliminând cele din subcategoria specificată
    data.anunturi = data.anunturi.filter((anunt: any) => anunt.subcategorie !== subcategorie);
    
    const deletedCount = initialCount - data.anunturi.length;
    
    // Actualizează statisticile
    data.statistici.total = data.anunturi.length;
    data.ultimaActualizare = new Date().toISOString();
    
    // Salvează datele
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    // Actualizează și fișierul de statistici
    const stats = {
      ultimaActualizare: data.ultimaActualizare,
      total: data.anunturi.length,
      noi: 0,
      expirate: 0,
      peOrase: {},
      peCategorii: {}
    };
    
    data.anunturi.forEach((anunt: any) => {
      stats.peOrase[anunt.oras] = (stats.peOrase[anunt.oras] || 0) + 1;
      stats.peCategorii[anunt.subcategorieNume] = (stats.peCategorii[anunt.subcategorieNume] || 0) + 1;
    });
    
    fs.writeFileSync('src/data/statistici-olx.json', JSON.stringify(stats, null, 2));

    return NextResponse.json({
      success: true,
      message: `Șterse ${deletedCount} anunțuri din subcategoria "${subcategorie}"`,
      deletedCount,
      remainingCount: data.anunturi.length
    });

  } catch (error) {
    console.error('Eroare la ștergerea subcategoriei:', error);
    return NextResponse.json(
      { error: 'Eroare internă server' },
      { status: 500 }
    );
  }
} 