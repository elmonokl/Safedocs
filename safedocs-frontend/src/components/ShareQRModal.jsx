import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { Copy, Check, X, Users, Share2, Link as LinkIcon } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { useDocuments } from '../contexts/DocumentContext'

function ShareQRModal({ documentId, shareUrl, onClose, onShareWithFriends }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('link') // 'link', 'qr', 'friends'
  const [friends, setFriends] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState([])
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const { shareWithFriends } = useDocuments()

  useEffect(() => {
    if (activeTab === 'qr' && shareUrl) {
      QRCode.toCanvas(canvasRef.current, shareUrl, { width: 220 }, () => {})
    }
  }, [shareUrl, activeTab])

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends()
    }
  }, [activeTab])

  const loadFriends = async () => {
    setLoadingFriends(true)
    try {
      const resp = await apiFetch('/api/friends')
      if (resp?.success && resp?.data?.friends) {
        setFriends(resp.data.friends)
      }
    } catch (err) {
      console.error('Error cargando amigos:', err)
    } finally {
      setLoadingFriends(false)
    }
  }

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Error copiando link:', err)
      }
    }
  }

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleShareWithFriends = async () => {
    if (selectedFriends.length === 0) {
      alert('Selecciona al menos un amigo')
      return
    }

    setSharing(true)
    try {
      const success = await shareWithFriends(documentId, selectedFriends, message)
      if (success) {
        alert(`Documento compartido con ${selectedFriends.length} amigo(s)`)
        onShareWithFriends && onShareWithFriends()
        onClose()
      }
    } catch (err) {
      alert('Error al compartir con amigos: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  if (!shareUrl && !documentId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-indigo-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Compartir documento</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Link
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'qr'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            QR
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Amigos
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link de compartir
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Comparte este link con quien quieras. Cualquiera con el link puede ver y descargar el documento.
              </p>
            </div>
          )}

          {activeTab === 'qr' && shareUrl && (
            <div className="space-y-4 text-center">
              <canvas ref={canvasRef} className="mx-auto" />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar link'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Escanea el código QR para acceder al documento
              </p>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe un mensaje para tus amigos..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecciona amigos ({selectedFriends.length} seleccionados)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg dark:border-gray-600">
                  {loadingFriends ? (
                    <div className="p-4 text-center text-gray-500">Cargando amigos...</div>
                  ) : friends.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No tienes amigos agregados</div>
                  ) : (
                    friends.map((friend) => {
                      const friendId = friend._id || friend.id
                      const isSelected = selectedFriends.includes(friendId)
                      return (
                        <button
                          key={friendId}
                          onClick={() => toggleFriend(friendId)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                          }`}
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <img
                            src={friend.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}`}
                            alt={friend.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-200">{friend.name}</p>
                            <p className="text-xs text-gray-500">{friend.career || friend.email}</p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
              <button
                onClick={handleShareWithFriends}
                disabled={selectedFriends.length === 0 || sharing}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {sharing ? 'Compartiendo...' : `Compartir con ${selectedFriends.length} amigo(s)`}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ShareQRModal


