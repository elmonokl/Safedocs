import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { Copy, Check, X, Users, Share2 } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { useDocuments } from '../contexts/DocumentContext'

function ShareQRModal({ documentId, shareUrl, onClose, onShareWithFriends }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('qr') // 'qr', 'friends'
  const [friends, setFriends] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState(() => {
    // Inicializar con una función para asegurar que siempre es un array válido
    const initial = []
    console.log('Inicializando selectedFriends:', initial)
    return initial
  })
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const [qrError, setQrError] = useState('')
  const { shareWithFriends } = useDocuments()

  useEffect(() => {
    if (activeTab === 'qr' && shareUrl && canvasRef.current) {
      setQrError('')
      // Pequeño delay para asegurar que el canvas esté completamente renderizado
      const timer = setTimeout(() => {
        if (canvasRef.current && shareUrl) {
          QRCode.toCanvas(canvasRef.current, shareUrl, { 
            width: 250,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          }, (error) => {
            if (error) {
              console.error('Error generando QR:', error)
              setQrError('Error al generar código QR. Por favor, intenta nuevamente.')
            } else {
              setQrError('')
            }
          })
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [shareUrl, activeTab])

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends()
      // No resetear selectedFriends aquí, solo cuando se cierra el modal
    }
  }, [activeTab])

  useEffect(() => {
    if (!Array.isArray(selectedFriends)) {
      setSelectedFriends([])
      return
    }
    
    if (selectedFriends.length > 0) {
      const hasInvalid = selectedFriends.some(id => {
        if (id == null || id === undefined) return true
        try {
          const idStr = String(id).trim()
          return !idStr || idStr === '' || idStr === 'undefined' || idStr === 'null' || idStr === '[object Object]'
        } catch {
          return true
        }
      })
      
      if (hasInvalid) {
        const validFriends = selectedFriends
          .filter(id => id != null && id !== undefined)
          .map(id => {
            try {
              return String(id).trim()
            } catch {
              return null
            }
          })
          .filter(id => id && id !== '' && id !== 'undefined' && id !== 'null' && id !== '[object Object]')
        
        if (validFriends.length !== selectedFriends.length) {
          setSelectedFriends(validFriends)
        }
      }
    }
  }, [selectedFriends])

  const loadFriends = async () => {
    setLoadingFriends(true)
    setFriends([])
    try {
      const resp = await apiFetch('/api/friends')
      
      if (resp?.success && Array.isArray(resp?.data?.friends)) {
        const normalizedFriends = resp.data.friends
          .map(friend => {
            let friendId = friend._id
            
            if (friendId && typeof friendId === 'object' && friendId._id) {
              friendId = friendId._id
            }
            
            if (!friendId && friend.id) {
              friendId = friend.id
            }
            
            if (!friendId) return null
            
            const friendIdStr = String(friendId).trim()
            
            if (!friendIdStr || friendIdStr === 'undefined' || friendIdStr === 'null' || friendIdStr === '') {
              return null
            }
            
            return {
              ...friend,
              _id: friendIdStr,
              id: friendIdStr
            }
          })
          .filter(friend => friend && friend._id && friend._id !== 'undefined' && friend._id !== 'null' && friend._id !== '')
        
        setFriends(normalizedFriends)
      }
    } catch (err) {
      console.error('Error cargando amigos:', err)
      alert('Error al cargar amigos. Por favor, intenta nuevamente.')
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
    if (!friendId) return
    
    const friendIdStr = String(friendId).trim()
    
    if (!friendIdStr || friendIdStr === 'undefined' || friendIdStr === 'null' || friendIdStr === '' || friendIdStr === '[object Object]') {
      return
    }
    
    setSelectedFriends(prev => {
      if (!Array.isArray(prev)) prev = []
      
      const validPrev = prev
        .filter(id => id != null && id !== undefined)
        .map(id => String(id).trim())
        .filter(id => id && id !== '' && id !== 'undefined' && id !== 'null' && id !== '[object Object]')
      
      const normalizedPrev = validPrev.map(id => String(id).trim())
      const isSelected = normalizedPrev.includes(friendIdStr)
      
      let newSelection
      if (isSelected) {
        newSelection = validPrev.filter(id => String(id).trim() !== friendIdStr)
      } else {
        newSelection = validPrev.concat([friendIdStr])
      }
      
      const validatedSelection = []
      for (const id of newSelection) {
        if (!id) continue
        let idStr
        try {
          idStr = String(id).trim()
        } catch {
          continue
        }
        if (idStr && idStr !== '' && idStr !== 'undefined' && idStr !== 'null' && idStr !== '[object Object]') {
          validatedSelection.push(idStr)
        }
      }
      
      console.log('toggleFriend: Selección validada final:', validatedSelection, 'length:', validatedSelection.length, 'tipo:', typeof validatedSelection, 'es array:', Array.isArray(validatedSelection))
      
      // Retornar un nuevo array siempre (nunca mutar)
      return Array.from(validatedSelection)
    })
  }

  const handleShareWithFriends = async () => {
    console.log('handleShareWithFriends llamado:', { selectedFriends, selectedFriendsLength: selectedFriends.length })
    
    // Normalizar y filtrar IDs válidos
    const validFriendIds = selectedFriends
      .filter(id => id != null && id !== undefined) // Filtrar null/undefined primero
      .map(id => String(id).trim())
      .filter(id => id && id.length > 0 && id !== 'undefined' && id !== 'null' && id !== '')
    
    console.log('IDs después de normalización:', { selectedFriends, validFriendIds, validFriendIdsLength: validFriendIds.length })
    
    if (validFriendIds.length === 0) {
      console.error('No hay IDs válidos. selectedFriends:', selectedFriends)
      alert('Selecciona al menos un amigo. Verifica que el amigo esté correctamente seleccionado.')
      return
    }

    if (!documentId) {
      alert('Error: No se pudo identificar el documento')
      return
    }

    setSharing(true)
    try {
      // Asegurar que los IDs sean strings consistentes
      const friendIds = validFriendIds
      console.log('Compartiendo documento con amigos:', { documentId, friendIds, message, selectedFriends, validFriendIds })
      
      const success = await shareWithFriends(documentId, friendIds, message)
      if (success) {
        alert(`Documento compartido con ${friendIds.length} amigo(s) exitosamente`)
        setSelectedFriends([])
        setMessage('')
        onShareWithFriends && onShareWithFriends()
        onClose()
      } else {
        // El error ya está manejado en shareWithFriends, solo mostrar mensaje genérico
        const errorMsg = 'Error al compartir con amigos. Verifica que el documento sea válido y que los usuarios seleccionados sean tus amigos.'
        alert(errorMsg)
      }
    } catch (err) {
      console.error('Error compartiendo con amigos:', err)
      alert('Error al compartir con amigos: ' + (err.message || 'Error desconocido'))
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
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-blue-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Compartir documento</h3>
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
            onClick={() => setActiveTab('qr')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'qr'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
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
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Amigos
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              {shareUrl ? (
                <>
                  <div className="flex justify-center">
                    <canvas 
                      ref={canvasRef} 
                      width="250" 
                      height="250"
                      className="mx-auto border-2 border-gray-200 rounded-lg p-2 bg-white" 
                    />
                  </div>
                  {qrError && (
                    <div className="text-red-600 text-sm">{qrError}</div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado' : 'Copiar link'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Escanea el código QR para acceder al documento
                  </p>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={shareUrl || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                      onClick={(e) => e.target.select()}
                    />
                  </div>
                </>
              ) : (
                <div className="text-gray-500">
                  <p>Generando código QR...</p>
                </div>
              )}
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
                      // El ID ya debería estar normalizado desde loadFriends
                      const friendIdStr = friend._id || friend.id
                      
                      // Validar que tenemos un ID válido
                      if (!friendIdStr || friendIdStr === 'undefined' || friendIdStr === 'null' || friendIdStr === '') {
                        console.error('Amigo sin ID válido en render:', friend)
                        return null
                      }
                      
                      // Normalizar selectedFriends para comparar correctamente
                      const normalizedSelected = selectedFriends
                        .filter(id => id != null && id !== undefined)
                        .map(id => String(id).trim())
                        .filter(id => id && id !== 'undefined' && id !== 'null' && id !== '' && id !== '[object Object]')
                      
                      const isSelected = normalizedSelected.includes(String(friendIdStr).trim())
                      
                      return (
                        <button
                          key={friendIdStr}
                          type="button"
                          onClick={() => {
                            const idToToggle = String(friendIdStr).trim()
                            console.log('Click en amigo:', { 
                              friendIdStr: idToToggle, 
                              friend, 
                              selectedFriends, 
                              selectedFriendsLength: selectedFriends.length,
                              normalizedSelected
                            })
                            toggleFriend(idToToggle)
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <img
                            src={friend.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'Usuario')}&background=2563eb&color=fff`}
                            alt={friend.name || 'Usuario'}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'Usuario')}&background=2563eb&color=fff`
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-200 truncate">{friend.name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500 truncate">{friend.career || friend.email || ''}</p>
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
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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


