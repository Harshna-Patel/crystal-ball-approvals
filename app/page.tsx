'use client';
import React, { useState } from 'react';
import { queue } from '../data/queue';
import { policy } from '../data/policy';
import { ChatPanel } from '../components/ChatPanel';
export default function Page() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string>(queue[0].id);
  return (
    <>
      <header className="topbar">
        <div>
          <strong>OomniEye</strong>
          <small>DIGITAL TWIN SOLUTIONS</small>
        </div>
        <span className="account">H</span>
      </header>
      <main>
        <section className="page-heading">
          <div>
            <p className="eyebrow">COMMAND CENTRE / OPERATIONS</p>
            <h1>Approvals & Review</h1>
            <p>Review the evidence. Make a confident decision.</p>
          </div>
          <span className="badge">4 pending requests</span>
        </section>
        <label className="sr-only" htmlFor="search">
          Search approvals
        </label>
        <input
          id="search"
          className="search"
          placeholder="Search approvals by title or submitter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <section className="queue">
          <div className="section-title">
            <h2>Pending approval requests</h2>
            <span>Queue view</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Folder / content name</th>
                  <th>Type</th>
                  <th>Submitted by</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {queue
                  .filter((q) =>
                    (q.title + ' ' + q.submittedBy).toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((q) => (
                    <tr key={q.id} className={selected === q.id ? 'selected' : ''}>
                      <td>
                        <button onClick={() => setSelected(q.id)}>{q.title}</button>
                      </td>
                      <td>{q.type}</td>
                      <td>{q.submittedBy}</td>
                      <td>{q.submittedAt}</td>
                      <td>
                        <span className="pending">Pending Review</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="details">
          <p className="eyebrow">SELECTED ITEM</p>
          <h2>{queue.find((q) => q.id === selected)?.title}</h2>
          <p>
            Inspect the actual file and supporting evidence before taking a decision. This
            assessment contains metadata only; no source files or approval mutation API are
            supplied.
          </p>
        </section>
        <details className="policy">
          <summary>Read the maintenance and approval policy</summary>
          {policy.map((p) => (
            <section key={p.id}>
              <h3>
                {p.title} <small>({p.id})</small>
              </h3>
              <p>{p.text}</p>
            </section>
          ))}
        </details>
      </main>
      <ChatPanel />
      <div className="page-footer">OomniEye · Assessment demo · Human approval required</div>
    </>
  );
}
