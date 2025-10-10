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
  const [version, setVersion] = useState<string>('')
  const [badgeColor, setBadgeColor] = useState<'yellow' | 'lime'>('yellow')

  useEffect(() => {
    fetch('/api/resume')
      .then(res => res.json())
      .then((data: ResumeListItem[]) => setList(data))
  }, [])

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then((data: { version?: string }) => {
        const fetched = data.version || ''
        setVersion(fetched)

        try {
          // use localStorage to remember previous version and badge color
          const prevVersion = localStorage.getItem('app_version')
          const prevColor = (localStorage.getItem('app_version_color') as 'yellow' | 'lime') || 'yellow'

          if (!prevVersion) {
            // first time: store current version and keep default color
            localStorage.setItem('app_version', fetched)
            localStorage.setItem('app_version_color', prevColor)
            setBadgeColor(prevColor)
          } else if (prevVersion !== fetched) {
            // version changed: toggle color between yellow and lime
            const newColor = prevColor === 'yellow' ? 'lime' : 'yellow'
            localStorage.setItem('app_version', fetched)
            localStorage.setItem('app_version_color', newColor)
            setBadgeColor(newColor)
          } else {
            // same version: keep previous color
            setBadgeColor(prevColor)
          }
        } catch (e) {
          // localStorage not available: fallback to yellow
          setBadgeColor('yellow')
        }
      })
      .catch(() => {
        setVersion('')
        setBadgeColor('yellow')
      })
  }, [])

  return (
    <div className="p-8 pt-12">
      {version && (
        <div
          className={`fixed top-4 left-4 font-bold px-2 py-1 rounded z-50 ${
            badgeColor === 'yellow' ? 'bg-yellow-400' : 'bg-lime-400'
          }`}
        >
          v{version}
        </div>
      )}
        <h1 className="text-2xl font-bold mb-4">Resume Builder v{version}</h1>
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
