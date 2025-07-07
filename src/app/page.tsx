"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface ResumeListItem {
  id: number
  fullName: string
  updatedAt: string
}

export default function Home() {
  const [list, setList] = useState<ResumeListItem[]>([])

  useEffect(() => {
    fetch('/api/resume')
      .then(res => res.json())
      .then((data: ResumeListItem[]) => setList(data))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Resumes</h1>
      <ul className="list-disc pl-5 mb-6">
        {list.map(r => (
          <li key={r.id}>
            <Link href={`/resume/${r.id}`} className="text-blue-600 hover:underline">
              {r.fullName || `Untitled Resume #${r.id}`}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/resume/new"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        + Create New Resume
      </Link>
    </div>
  )
}
