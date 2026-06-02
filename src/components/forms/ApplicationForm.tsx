import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface FormValues {
  name: string;
  email: string;
  institution: string;
  career: string;
  message: string;
}

interface Props {
  schoolTitle: string;
}

export default function ApplicationForm({ schoolTitle }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>();

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      // Stub: replace with real endpoint (e.g. Formspree, Netlify Forms, or your own API)
      await new Promise((r) => setTimeout(r, 800));
      // TODO: replace stub with real endpoint (e.g. Formspree, Netlify Forms, or your own API)
      setSubmitted(true);
      reset();
    } catch {
      setServerError('Something went wrong. Please try again or email us directly.');
    }
  };

  const inputClass =
    'w-full bg-white/80 border border-ink/10 rounded-xl px-3 py-2.5 text-ink text-sm placeholder-ink/35 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/15 transition-colors dark:border-white/15 dark:bg-white/10 dark:text-bone dark:placeholder-bone/35';
  const errorClass = 'text-red text-xs mt-1';
  const labelClass = 'text-sm text-ink/65 block mb-1.5 dark:text-bone/65';

  if (submitted) {
    return (
      <div className="rounded-2xl border border-blue/20 bg-gradient-to-br from-white/85 via-bone to-teal/10 p-8 text-center shadow-[0_16px_40px_rgba(0,140,140,0.08)] dark:border-white/10 dark:from-white/10 dark:via-ink dark:to-teal/10">
        <p className="text-blue text-lg font-semibold mb-2">Thank you!</p>
        <p className="text-ink/70 text-sm dark:text-bone/70">
          We've noted your interest in <strong>{schoolTitle}</strong>. We'll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-ink/10 bg-gradient-to-br from-white/85 via-bone to-blue/5 p-6 space-y-5 max-w-xl shadow-[0_16px_40px_rgba(4,101,173,0.08)] dark:border-white/10 dark:from-white/10 dark:via-ink dark:to-blue/10"
      noValidate
    >
      {/* Full name */}
      <div>
        <label htmlFor="name" className={labelClass}>Full name *</label>
        <input
          id="name"
          {...register('name', { required: 'Name is required' })}
          placeholder="Jane Smith"
          className={inputClass}
        />
        {errors.name && <p className={errorClass} role="alert">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>Email address *</label>
        <input
          id="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
          type="email"
          placeholder="jane@university.edu"
          className={inputClass}
        />
        {errors.email && <p className={errorClass} role="alert">{errors.email.message}</p>}
      </div>

      {/* Institution */}
      <div>
        <label htmlFor="institution" className={labelClass}>Institution</label>
        <input
          id="institution"
          {...register('institution')}
          placeholder="University or research institute"
          className={inputClass}
        />
      </div>

      {/* Career stage */}
      <div>
        <label htmlFor="career" className={labelClass}>Career stage</label>
        <select
          id="career"
          {...register('career')}
          className={inputClass}
          defaultValue=""
        >
          <option value="" disabled>Select…</option>
          <option value="phd">PhD student</option>
          <option value="postdoc">Postdoctoral researcher</option>
          <option value="faculty">Faculty / staff scientist</option>
          <option value="industry">Industry</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClass}>Message (optional)</label>
        <textarea
          id="message"
          {...register('message')}
          rows={3}
          placeholder="Any questions or context you'd like to share…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {serverError && (
        <p className="text-red text-sm" role="alert">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-blue py-3 font-semibold text-bone shadow-[0_12px_30px_rgba(4,101,173,0.18)] transition-all hover:-translate-y-0.5 hover:bg-blue/90 disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending…' : 'Submit Interest'}
      </button>
    </form>
  );
}
