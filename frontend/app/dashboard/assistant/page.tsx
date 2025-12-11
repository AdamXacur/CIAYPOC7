"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Upload, FileText, Trash2, MessageSquare, Library, Plus, MessageCircle } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { ingestionService, chatService } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

export default function AssistantPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat')
  
  // --- Estado del Chat ---
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  
  // CORRECCIÓN: Inicializar con el saludo por defecto
  const [messages, setMessages] = useState<{role: 'user'|'bot', content: string}[]>([
    {role: 'bot', content: 'Hola, soy el Asistente de Soporte TI. ¿En qué puedo ayudarte con los sistemas?'}
  ])
  
  const [input, setInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Estado de Documentos ---
  const [documents, setDocuments] = useState<string[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => { 
    if (activeTab === 'chat') scrollToBottom() 
  }, [messages, activeTab])

  // Cargar historial al iniciar
  useEffect(() => {
    loadSessions()
  }, [])

  // Cargar documentos cuando se entra a la pestaña de docs
  useEffect(() => {
    if (activeTab === 'docs') loadDocuments()
  }, [activeTab])

  const loadSessions = async () => {
    try {
        const data = await chatService.listSessions()
        setSessions(data)
    } catch (error) {
        console.error("Error cargando sesiones")
    }
  }

  const loadDocuments = async () => {
    setIsLoadingDocs(true)
    try {
        const docs = await ingestionService.listDocuments()
        setDocuments(docs)
    } catch (error) {
        console.error("Error cargando documentos")
    } finally {
        setIsLoadingDocs(false)
    }
  }

  const handleNewChat = async () => {
      setSessionId(null)
      // Resetear al saludo inicial
      setMessages([{role: 'bot', content: 'Hola, soy el Asistente de Soporte TI. ¿En qué puedo ayudarte con los sistemas?'}])
  }

  const handleSelectSession = async (id: string) => {
      setSessionId(id)
      setIsChatLoading(true)
      try {
          const msgs = await chatService.getSessionMessages(id)
          setMessages(msgs)
      } catch (error) {
          toast.error("Error cargando conversación")
      } finally {
          setIsChatLoading(false)
      }
  }

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      if(!confirm("¿Borrar conversación?")) return
      try {
          await chatService.deleteSession(id)
          if (sessionId === id) handleNewChat()
          loadSessions()
      } catch (error) {
          toast.error("Error al borrar")
      }
  }

  // --- Lógica del Chat ---
  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsChatLoading(true)

    setMessages(prev => [...prev, { role: 'bot', content: "" }])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/chat/stream`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ message: userMsg, session_id: sessionId })
      })

      if (response.status === 401) {
         window.location.href = '/login?reason=expired';
         return;
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let botResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          botResponse += chunk
          
          setMessages(prev => {
            const newMsgs = [...prev]
            newMsgs[newMsgs.length - 1].content = botResponse
            return newMsgs
          })
        }
      }
      
      loadSessions()

    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1].content = "Error de conexión con el servidor."
        return newMsgs
      })
    } finally {
      setIsChatLoading(false)
    }
  }

  // --- Lógica de Ingesta ---
  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    try {
      const res = await ingestionService.uploadManual(uploadFile, "general")
      toast.success(`Manual "${res.filename}" indexado.`)
      setIsUploadOpen(false)
      setUploadFile(null)
      loadDocuments()
    } catch (error: any) {
      toast.error("Error al procesar el manual.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDoc = async (filename: string) => {
      if (!confirm(`¿Estás seguro de eliminar "${filename}"?`)) return;
      try {
          await ingestionService.deleteDocument(filename)
          toast.success("Documento eliminado")
          loadDocuments()
      } catch (error) {
          toast.error("No se pudo eliminar el documento")
      }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      
      {/* --- HEADER Y PESTAÑAS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h2 className="text-2xl font-serif font-bold text-ciay-brown flex items-center gap-2">
                <Sparkles className="text-ciay-gold"/> Mesa de Ayuda Inteligente
              </h2>
              <p className="text-ciay-slate text-sm">Consultas técnicas basadas en manuales oficiales.</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'chat' 
                    ? 'bg-ciay-brown text-white shadow' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'docs' 
                    ? 'bg-ciay-brown text-white shadow' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Library className="w-4 h-4" /> Documentos
              </button>
          </div>
      </div>

      {/* --- VISTA DE CHAT (CON HISTORIAL) --- */}
      {activeTab === 'chat' && (
          <div className="flex-1 flex gap-4 h-full overflow-hidden">
              
              {/* SIDEBAR HISTORIAL */}
              <Card className="w-64 flex flex-col border-ciay-gold/20 shadow-md bg-white">
                  <div className="p-3 border-b border-gray-100">
                      <Button onClick={handleNewChat} className="w-full bg-ciay-brown hover:bg-ciay-brown/90 text-xs">
                          <Plus className="w-4 h-4 mr-2" /> Nueva Conversación
                      </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {sessions.map(session => (
                          <div 
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={`p-2 rounded-md text-sm cursor-pointer flex justify-between items-center group ${
                                sessionId === session.id ? 'bg-ciay-cream text-ciay-brown font-bold' : 'hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                              <div className="flex items-center gap-2 overflow-hidden">
                                  <MessageCircle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{session.title}</span>
                              </div>
                              <button 
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                              >
                                  <Trash2 className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
              </Card>

              {/* VENTANA DE CHAT */}
              <Card className="flex-1 flex flex-col border-ciay-gold/20 shadow-lg overflow-hidden bg-white animate-in fade-in">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            m.role === 'user' ? 'bg-ciay-brown text-white' : 'bg-ciay-gold text-white'
                        }`}>
                            {m.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm text-sm overflow-hidden ${
                            m.role === 'user' 
                            ? 'bg-ciay-brown text-white rounded-tr-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                        }`}>
                            {m.content ? (
                                <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert text-white' : ''}`}>
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                    <span className="text-xs">Consultando manuales...</span>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu pregunta técnica..."
                            className="flex-1 border-gray-300 focus:border-ciay-gold"
                            disabled={isChatLoading}
                        />
                        <Button type="submit" className="bg-ciay-brown hover:bg-ciay-brown/90" disabled={isChatLoading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
              </Card>
          </div>
      )}

      {/* --- VISTA DE DOCUMENTOS --- */}
      {activeTab === 'docs' && (
          <Card className="flex-1 flex flex-col border-ciay-gold/20 shadow-lg bg-white animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-ciay-cream/30">
                <div>
                    <h3 className="font-bold text-ciay-brown text-lg">Gestión de Conocimiento</h3>
                    <p className="text-sm text-gray-500">Estos son los manuales que el bot utiliza para responder.</p>
                </div>
                
                {user?.role === 'superadmin' && (
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-ciay-brown hover:bg-ciay-brown/90">
                                <Upload className="mr-2 h-4 w-4" /> Subir Manual
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cargar Conocimiento</DialogTitle>
                                <DialogDescription>Sube un PDF. El sistema lo procesará para responder preguntas.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Archivo PDF</Label>
                                    <Input type="file" accept=".pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                                </div>
                                <Button onClick={handleUpload} disabled={!uploadFile || isUploading} className="w-full bg-ciay-brown">
                                    {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {isUploading ? "Procesando..." : "Entrenar Bot"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                {isLoadingDocs ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-ciay-gold w-8 h-8"/></div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No hay manuales cargados en la base de conocimiento.</p>
                        {user?.role === 'superadmin' && <p className="text-sm mt-2">Sube uno para comenzar.</p>}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {documents.map((doc, idx) => (
                            <div key={idx} className="flex flex-col justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-ciay-gold/50 hover:shadow-md transition-all group">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-white rounded-lg border border-gray-100 text-red-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-gray-800 text-sm truncate" title={doc}>{doc}</h4>
                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">Indexado</span>
                                    </div>
                                </div>
                                
                                {user?.role === 'superadmin' && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDeleteDoc(doc)}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 w-full justify-start"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </Card>
      )}
    </div>
  )
}