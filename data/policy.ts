// Authored assessment policy: 4 chunks, 255+ words. IDs are stable citations.
export const policy = [
  {
    id: 'policy-1',
    title: 'Safety and urgency',
    text: `Review safety equipment and sensor specifications before material that depends on those specifications. Check equipment certification, sensor calibration evidence, and the revision number. A missing certificate, a failed calibration, or an unresolved safety discrepancy blocks approval and must be escalated to the safety lead. The queue alone does not establish a real incident, severity, deadline, or overdue status. All four reference items share the same displayed submission date; do not invent different ages or emergency conditions. Safety-first ordering is a recommendation based on this policy, not a recorded priority field.`,
  },
  {
    id: 'policy-2',
    title: 'Review and decision',
    text: `Open the item and check its title, submitter, file type, revision, and supporting evidence. Compare the content with the relevant checklist. Record a clear reason for your decision. Approve only when the evidence is complete and consistent. If evidence is missing, request changes and explain exactly what must be supplied. Reject only with a documented reason. Approval authority belongs to an authorised human operator; the assistant provides guidance and must never claim it has approved, rejected, or changed a record.`,
  },
  {
    id: 'policy-3',
    title: 'Patrol onboarding and drone video',
    text: `For patrol onboarding, verify the operating procedure, emergency contacts, and technician check-in checklist. For a drone patrol video, confirm the correct location, capture date, visibility, and safe flight compliance. If the video is unclear or the location cannot be verified, ask the submitter for a replacement or clarification. Do not infer conditions outside the visible evidence. Refer unresolved operational questions to the site supervisor.`,
  },
  {
    id: 'policy-4',
    title: 'Spatial layout and audit trail',
    text: `For the spatial zone layout and camera map, compare zone boundaries, camera coverage, restricted areas, and emergency exits with the current site plan. Escalate blind spots that affect safety. Keep the submitter, reviewer, decision time, revision, and decision reason in the audit trail. Questions about retention periods, budgets, legal permissions, or unavailable site documents are outside this note: say the information is unavailable and ask the supervisor. Never invent a policy answer.`,
  },
] as const;
export function retrieve(question: string) {
  const words = new Set(question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const ranked = policy
    .map((p) => ({
      ...p,
      score: [...words].filter(
        (w) => w.length > 2 && (p.title + ' ' + p.text).toLowerCase().includes(w),
      ).length,
    }))
    .sort((a, b) => b.score - a.score);
  // Multilingual/short questions may not overlap English keywords: include all 4 small chunks.
  return ranked[0].score === 0 ? [...policy] : ranked.filter((p) => p.score > 0).slice(0, 3);
}
