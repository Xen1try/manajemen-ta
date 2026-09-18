import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function Pill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: string }) { 
    return <span className={`status-pill ${tone}`}>{children}</span> 
}

export function PageHeading({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc: string; action?: string }) { 
    const [message, setMessage] = useState(''); 
    
    return (
        <>
            <section className="welcome-row">
                <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                    <p className="subhead">{desc}</p>
                </div>
                {action && (
                    <div className="heading-action">
                        <button className="primary-action" onClick={() => { setMessage(`${action} siap diproses`); window.setTimeout(() => setMessage(''), 2400) }}>
                            <Sparkles size={16} /> {action}
                        </button>
                        {message && <span className="action-feedback" role="status">{message}</span>}
                    </div>
                )}
            </section>
            <div className="flow-stepper" aria-label="Progress flow tugas akhir">
                {['Profil', 'Judul', 'Bimbingan', 'Dokumen', 'Sidang'].map((phase, index) => (
                    <div className={index < 2 ? 'flow-step done' : index === 2 ? 'flow-step current' : 'flow-step'} key={phase}>
                        <span>{index < 2 ? '✓' : index + 1}</span>
                        <small>{phase}</small>
                    </div>
                ))}
            </div>
        </>
    );
}