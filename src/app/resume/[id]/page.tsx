"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
// Use the pro version to support modern CSS color functions like oklch()
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
// import Label from '@/components/ui/label' (unused)

/* eslint-disable @typescript-eslint/no-explicit-any */
const markdownComponents = {
  ul: (props: any) => <ul className="list-disc list-inside mt-2 mb-2" {...props} />, 
  ol: (props: any) => <ol className="list-decimal list-inside mt-2 mb-2" {...props} />,
  li: (props: any) => <li className="ml-4 mb-1" {...props} />,
}

interface Experience { company: string; role: string; start: string; end: string; details: string }
interface Education { institution: string; degree: string; start: string; end: string }
interface Project { name: string; description: string }
interface Certification { name: string; issuer: string; date: string }

export default function ResumePage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([ { company: '', role: '', start: '', end: '', details: '' } ])
  const [education, setEducation] = useState<Education[]>([ { institution: '', degree: '', start: '', end: '' } ])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [projects, setProjects] = useState<Project[]>([ { name: '', description: '' } ])
  const [certifications, setCertifications] = useState<Certification[]>([ { name: '', issuer: '', date: '' } ])
  const previewRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Handlers for dynamic resume sections
  const addExperience = () => setExperiences([...experiences, { company: '', role: '', start: '', end: '', details: '' }])
  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const list = [...experiences]; list[index][field] = value; setExperiences(list)
  }
  const removeExperience = (index: number) => setExperiences(experiences.filter((_, i) => i !== index))

  const addEducation = () => setEducation([...education, { institution: '', degree: '', start: '', end: '' }])
  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const list = [...education]; list[index][field] = value; setEducation(list)
  }
  const removeEducation = (index: number) => setEducation(education.filter((_, i) => i !== index))

  const addProject = () => setProjects([...projects, { name: '', description: '' }])
  const updateProject = (index: number, field: keyof Project, value: string) => {
    const list = [...projects]; list[index][field] = value; setProjects(list)
  }
  const removeProject = (index: number) => setProjects(projects.filter((_, i) => i !== index))

  const addCertification = () => setCertifications([...certifications, { name: '', issuer: '', date: '' }])
  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const list = [...certifications]; list[index][field] = value; setCertifications(list)
  }
  const removeCertification = (index: number) => setCertifications(certifications.filter((_, i) => i !== index))

  const addSkill = () => {
    if (skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput('') }
  }
  const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index))
  
  useEffect(() => {
    if (!isNew) {
      fetch(`/api/resume?id=${id}`)
        .then(res => res.json())
        .then(data => {
          setFullName(data.fullName || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
          setProfilePic(data.profilePic || '')
          setHeadline(data.headline || '')
          setSummary(data.summary || '')
          setExperiences(data.experiences.length ? data.experiences : experiences)
          setEducation(data.education.length ? data.education : education)
          setSkills(data.skills || [])
          setProjects(data.projects.length ? data.projects : projects)
          setCertifications(data.certifications.length ? data.certifications : certifications)
        })
    }
  }, [id])

  const exportPDF = async () => {
    if (!previewRef.current) return
    // Hide the 'Preview' title
    const previewEl = previewRef.current!
    const header = previewEl.querySelector('h2') as HTMLElement|null
    if (header) header.style.display = 'none'
    // Clone the preview container (which houses the resume card)
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '-9999px'
    container.style.left = '-9999px'
    container.style.pointerEvents = 'none'
    const clone = previewEl.cloneNode(true) as HTMLElement
    container.appendChild(clone)
    document.body.appendChild(container)
    // Render cloned content to canvas with high resolution and white background
    const canvas = await html2canvas(clone, {
      useCORS: true,
      imageTimeout: 0,
      scale: window.devicePixelRatio || 1,
      backgroundColor: '#ffffff',
    })
    // Clean up and restore header
    document.body.removeChild(container)
    if (header) header.style.display = ''
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'pt', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    // Fill PDF background white, then add the image
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save('resume.pdf')
  }

  const saveResume = async () => {
    const payload = { fullName, email, phone, profilePic, headline, summary, experiences, education, skills, projects, certifications }
    const url = isNew ? '/api/resume' : `/api/resume?id=${id}`
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (isNew && json.id) {
      router.replace(`/resume/${json.id}`)
    }
  }

  if (isNew === false && !fullName && !email && !phone && !headline && !summary) {
    // still loading
    return <div className="p-8">Loading resume...</div>
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-1/2 p-8 space-y-6 overflow-auto border-r bg-gray-50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
          <Button variant="outline" size="sm" onClick={() => router.push('/')}>Home</Button>
        </div>
        {/* Profile Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="space-y-2">
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
            <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
            <Input id="profilePic" value={profilePic} onChange={e => setProfilePic(e.target.value)} placeholder="Profile Picture URL" />
          </div>
        </div>
        {/* Headline & Summary */}
        <div>
          <Input id="headline" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline" />
          <Textarea id="summary" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" />
        </div>
        {/* Work Experience */}
        <div className="space-y-4">
          {experiences.map((exp, idx) => (
            <div key={idx} className="border p-4 rounded space-y-2">
              <Input value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} placeholder="Company" />
              <Input value={exp.role} onChange={e => updateExperience(idx, 'role', e.target.value)} placeholder="Role" />
              <div className="flex space-x-2">
                <Input value={exp.start} onChange={e => updateExperience(idx, 'start', e.target.value)} placeholder="Start Date" />
                <Input value={exp.end} onChange={e => updateExperience(idx, 'end', e.target.value)} placeholder="End Date" />
              </div>
              <Textarea value={exp.details} onChange={e => updateExperience(idx, 'details', e.target.value)} placeholder="Details (markdown supported)" />
              <Button variant="destructive" size="sm" onClick={() => removeExperience(idx)}>Remove</Button>
            </div>
          ))}
          <Button size="sm" onClick={addExperience}>Add Experience</Button>
        </div>
        {/* Education */}
        <div className="space-y-4">
          {education.map((edu, idx) => (
            <div key={idx} className="border p-4 rounded space-y-2">
              <Input value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} placeholder="Institution" />
              <Input value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="Degree" />
              <div className="flex space-x-2">
                <Input value={edu.start} onChange={e => updateEducation(idx, 'start', e.target.value)} placeholder="Start Date" />
                <Input value={edu.end} onChange={e => updateEducation(idx, 'end', e.target.value)} placeholder="End Date" />
              </div>
              <Button variant="destructive" size="sm" onClick={() => removeEducation(idx)}>Remove</Button>
            </div>
          ))}
          <Button size="sm" onClick={addEducation}>Add Education</Button>
        </div>
        {/* Skills */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add Skill" />
            <Button size="sm" onClick={addSkill}>Add Skill</Button>
          </div>
          <div className="flex flex-wrap space-x-2">
            {skills.map((skill, idx) => (
              <span key={idx} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                {skill}
                <Button variant="ghost" size="icon" className="ml-1" onClick={() => removeSkill(idx)}>×</Button>
              </span>
            ))}
          </div>
        </div>
        {/* Projects */}
        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div key={idx} className="border p-4 rounded space-y-2">
              <Input value={proj.name} onChange={e => updateProject(idx, 'name', e.target.value)} placeholder="Project Name" />
              <Textarea value={proj.description} onChange={e => updateProject(idx, 'description', e.target.value)} placeholder="Description (markdown supported)" />
              <Button variant="destructive" size="sm" onClick={() => removeProject(idx)}>Remove</Button>
            </div>
          ))}
          <Button size="sm" onClick={addProject}>Add Project</Button>
        </div>
        {/* Certifications */}
        <div className="space-y-4">
          {certifications.map((cert, idx) => (
            <div key={idx} className="border p-4 rounded space-y-2">
              <Input value={cert.name} onChange={e => updateCertification(idx, 'name', e.target.value)} placeholder="Certification Name" />
              <Input value={cert.issuer} onChange={e => updateCertification(idx, 'issuer', e.target.value)} placeholder="Issuer" />
              <Input value={cert.date} onChange={e => updateCertification(idx, 'date', e.target.value)} placeholder="Date" />
              <Button variant="destructive" size="sm" onClick={() => removeCertification(idx)}>Remove</Button>
            </div>
          ))}
          <Button size="sm" onClick={addCertification}>Add Certification</Button>
        </div>
        {/* Save & Export */}
        <div className="flex space-x-2">
          <Button onClick={saveResume}>Save</Button>
          <Button onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>
      {/* Preview */}
      <div className="w-1/2 p-8 overflow-auto" ref={previewRef}>
        <h2 className="text-2xl font-bold mb-4">Preview</h2>
        <div ref={cardRef} className="resume-card bg-white p-6 rounded shadow">
          {/* Profile Preview */}
          {profilePic && (
            <img
              crossOrigin="anonymous"
              src={profilePic}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto"
            />
          )}
          <h1 className="text-center text-3xl font-bold mt-4">{fullName}</h1>
          <p className="text-center text-sm text-gray-600">{email} | {phone}</p>
          <h3 className="mt-4 font-semibold">{headline}</h3>
          <ReactMarkdown components={markdownComponents}>{summary}</ReactMarkdown>
          {/* Additional sections */}
          {/* Work Experience */}
          {experiences.some(e => e.company) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Work Experience</h3>
              {experiences.map((exp, i) => exp.company && (
                <div key={i} className="mt-2">
                  <p className="font-semibold">{exp.role} at {exp.company}</p>
                  <p className="text-sm text-gray-600">{exp.start} - {exp.end}</p>
                  <ReactMarkdown components={markdownComponents}>{exp.details}</ReactMarkdown>
                </div>
              ))}
            </div>
          )}
          {/* Education */}
          {education.some(e => e.institution) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Education</h3>
              {education.map((edu, i) => edu.institution && (
                <div key={i} className="mt-2">
                  <p className="font-semibold">{edu.degree}, {edu.institution}</p>
                  <p className="text-sm text-gray-600">{edu.start} - {edu.end}</p>
                </div>
              ))}
            </div>
          )}
          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Skills</h3>
              <ul className="list-disc list-inside flex flex-wrap">
                {skills.map((skill, i) => (
                  <li key={i} className="mr-4">{skill}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Projects */}
          {projects.some(p => p.name) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Projects</h3>
              {projects.map((p, i) => p.name && (
                <div key={i} className="mt-2">
                  <p className="font-semibold">{p.name}</p>
                  <ReactMarkdown components={markdownComponents}>{p.description}</ReactMarkdown>
                </div>
              ))}
            </div>
          )}
          {/* Certifications */}
          {certifications.some(c => c.name) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Certifications</h3>
              <ul className="list-disc list-inside">
                {certifications.map((c, i) => c.name && (
                  <li key={i} className="mt-1">{c.name} - {c.issuer} ({c.date})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
