"use client"

interface TestModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TestModal({ isOpen, onClose }: TestModalProps) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        border: '2px solid red',
        borderRadius: '8px',
        maxWidth: '400px',
        color: 'black'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Test Modal</h2>
        <p style={{ margin: '0 0 20px 0' }}>This is a test modal to verify modal functionality works correctly.</p>
        <button 
          onClick={onClose}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
