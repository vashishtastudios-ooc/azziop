import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import type { BrandDNA } from '~/types';

/**
 * PUT /api/brand-dna
 * Updates brand DNA for the user's latest project
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updates: Partial<BrandDNA> = await req.json();

    // Find the user's latest project
    const project = await db.project.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        brandDNA: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!project || !project.brandDNA) {
      return NextResponse.json({ success: false, error: 'Project or Brand DNA not found' }, { status: 404 });
    }

    // Update brand DNA
    const updatedBrandDNA = await db.brandDNA.update({
      where: { id: project.brandDNA.id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      data: updatedBrandDNA,
    });
  } catch (error) {
    console.error('API Error (Brand DNA Update):', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

