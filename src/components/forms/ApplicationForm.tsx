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
      console.log('Interest form submitted', { school: schoolTitle, ...data });
      setSubmitted(true);
      reset();
    } catch {
      setServerError('Something went wrong. Please try again or email us directly.');
    }
  };

  const inputClass =
    'w-full bg-navy-900 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:border-teal-400 focus:outline-none transition-colors';
  const errorClass = 'text-red-400 text-xs mt-1';
  const labelClass = 'text-sm text-slate-300 block mb-1.5';

  if (submitted) {
    return (
      <div className="bg-teal-900/25 border border-teal-500/30 rounded-xl p-8 text-center">
        <p className="text-teal-400 text-lg font-semibold mb-2">Thank you!</p>
        <p className="text-slate-300 text-sm">
          We've noted your interest in <strong>{schoolTitle}</strong>. We'll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-navy-800 border border-white/10 rounded-xl p-6 space-y-5 max-w-xl"
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
        <p className="text-red-400 text-sm" role="alert">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent-teal text-navy-900 font-semibold py-3 rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Sending…' : 'Submit Interest'}
      </button>
    </form>
  );
}
