import { useState } from 'react';

export default function LoginModal({ onClose, onSubmit }) {
  const [phone, setPhone] = useState('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close login">×</button>
        <h3>HELLO, COMETEER.</h3>
        <input
          className="login-input"
          placeholder="Enter Mobile Number (+91)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="btn-dark" onClick={onSubmit}>SEND OTP</button>
        <p className="modal-fine">By continuing, you agree to our T&C and Privacy Policy</p>
      </div>
    </div>
  );
}
