/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/resume
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get('id');
  if (idParam) {
    const id = parseInt(idParam, 10);
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        experiences: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true,
      },
    });
    if (!resume) {
      return NextResponse.json({
        fullName: '', email: '', phone: '', profilePic: '',
        headline: '', summary: '', experiences: [],
        education: [], skills: [], projects: [], certifications: [],
      });
    }
    return NextResponse.json({
      fullName: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      profilePic: resume.profilePic,
      headline: resume.headline,
      summary: resume.summary,
      experiences: resume.experiences,
      education: resume.education,
      skills: resume.skills.map(s => s.name),
      projects: resume.projects,
      certifications: resume.certifications,
    });
  }
  // List all resumes
  const list = await prisma.resume.findMany({
    select: { id: true, fullName: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(list);
}

// POST /api/resume
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get('id');
  const data = await request.json();
  let rid: number;
  if (idParam) {
    const id = parseInt(idParam, 10);
    const record = await prisma.resume.upsert({
      where: { id },
      create: {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        profilePic: data.profilePic || '',
        headline: data.headline || '',
        summary: data.summary || '',
      },
      update: {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        profilePic: data.profilePic || '',
        headline: data.headline || '',
        summary: data.summary || '',
      },
    });
    rid = record.id;
    await Promise.all([
      prisma.experience.deleteMany({ where: { resumeId: rid } }),
      prisma.education.deleteMany({ where: { resumeId: rid } }),
      prisma.skill.deleteMany({ where: { resumeId: rid } }),
      prisma.project.deleteMany({ where: { resumeId: rid } }),
      prisma.certification.deleteMany({ where: { resumeId: rid } }),
    ]);
  } else {
    const record = await prisma.resume.create({
      data: {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        profilePic: data.profilePic || '',
        headline: data.headline || '',
        summary: data.summary || '',
      },
    });
    rid = record.id;
  }
  await Promise.all([
    prisma.experience.createMany({
      data: (data.experiences || []).map((e: any) => ({
        resumeId: rid, company: e.company, role: e.role,
        start: e.start, end: e.end, details: e.details,
      })),
    }),
    prisma.education.createMany({
      data: (data.education || []).map((e: any) => ({
        resumeId: rid, institution: e.institution,
        degree: e.degree, start: e.start, end: e.end,
      })),
    }),
    prisma.skill.createMany({
      data: (data.skills || []).map((s: string) => ({ resumeId: rid, name: s })),
    }),
    prisma.project.createMany({
      data: (data.projects || []).map((p: any) => ({
        resumeId: rid, name: p.name, description: p.description,
      })),
    }),
    prisma.certification.createMany({
      data: (data.certifications || []).map((c: any) => ({
        resumeId: rid, name: c.name, issuer: c.issuer, date: c.date,
      })),
    }),
  ]);
  return NextResponse.json({ status: 'ok', id: rid });
}
