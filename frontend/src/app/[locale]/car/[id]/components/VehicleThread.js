'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, MessageSquare, Share2, Send, Pin } from 'lucide-react'
import { listingsService } from '@/services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function VehicleThread({ vehicle }) {
  const t = useTranslations('car_details')
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')

  const vehicleId = vehicle?.id
  const partner = vehicle?.partner

  // Fetch reactions
  const { data: reactionsData } = useQuery({
    queryKey: ['vehicleReactions', vehicleId],
    queryFn: () => listingsService.getVehicleReactions(vehicleId),
    enabled: !!vehicleId,
  })

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ['vehicleComments', vehicleId],
    queryFn: () => listingsService.getVehicleComments(vehicleId),
    enabled: !!vehicleId,
  })

  const reactMutation = useMutation({
    mutationFn: (action) => {
      if (action === 'add') return listingsService.addVehicleReaction(vehicleId, 'like')
      return listingsService.removeVehicleReaction(vehicleId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleReactions', vehicleId] })
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text) => listingsService.addVehicleComment(vehicleId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleComments', vehicleId] })
      setCommentText('')
    },
  })

  const handleReact = () => {
    if (userReaction) {
      reactMutation.mutate('remove')
    } else {
      reactMutation.mutate('add')
    }
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    commentMutation.mutate(commentText)
  }

  const summary = reactionsData?.data?.summary || reactionsData?.summary || []
  const userReaction = reactionsData?.data?.user_reaction || reactionsData?.user_reaction || null
  const reactCount = summary.reduce((acc, curr) => acc + curr.count, 0)
  
  const comments = commentsData?.data?.results || commentsData?.results || []

  const hostName = partner?.business_name || (partner?.user?.first_name ? partner.user.first_name + ' ' + partner.user.last_name : '') || 'Host'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-gray-900 pb-8 mt-12">
      {/* Pinned Post Header */}
      <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-4">
        {/* Pinned Badge */}
        <div className="absolute -top-3 right-6 bg-[#ea580c] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <Pin className="w-3 h-3" /> Pinned by Owner
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 shadow-sm border-2 border-white">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}`} alt={hostName} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">{hostName}</span>
                <span className="bg-orange-100 text-[#ea580c] text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">HOST</span>
              </div>
              <span className="text-gray-400 text-xs font-medium">Original Post</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-700 leading-relaxed text-sm">
          {vehicle?.description || "Check out this beautiful vehicle!"}
        </p>

        {/* Image */}
        <div className="w-full aspect-video rounded-2xl bg-gray-100 overflow-hidden border border-gray-100">
          <img src={vehicle?.images?.[0]?.image || vehicle?.images?.[0] || "/carsymbol.jpg"} alt={vehicle?.model || "Car"} className="w-full h-full object-cover" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <div className="flex items-center gap-6">
            <button onClick={handleReact} className={`flex items-center gap-2 transition-colors group ${userReaction ? 'text-[#ea580c]' : 'text-gray-500 hover:text-[#ea580c]'}`}>
              <div className={`p-2 rounded-full transition-colors ${userReaction ? 'bg-orange-50' : 'group-hover:bg-orange-50'}`}>
                <Heart className={`w-5 h-5 ${userReaction ? 'fill-[#ea580c]' : 'group-hover:fill-[#ea580c]'}`} />
              </div>
              <span className="font-bold text-sm">{reactCount > 0 ? reactCount : 0}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">{comments.length > 0 ? comments.length : 'Reply'}</span>
            </button>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* REPLIES Divider */}
      {comments.length > 0 && (
        <div className="flex items-center justify-center my-8 gap-4 px-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">REPLIES</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>
      )}

      {/* Replies Section */}
      <div className="space-y-5 px-2">
        {comments.map((comment) => {
          const isHost = comment.user?.id === partner?.user?.id
          const commenterName = comment.user?.first_name ? `${comment.user.first_name} ${comment.user.last_name || ''}` : comment.user?.username || 'Someone'
          
          return (
            <div key={comment.id} className={`flex gap-4 ${isHost ? 'ml-8' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1 border-2 border-white shadow-sm">
                {isHost ? (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}`} alt={hostName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold uppercase">
                        {comment.user?.first_name?.[0] || comment.user?.username?.[0] || '?'}
                    </div>
                )}
              </div>
              <div className={`${isHost ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-gray-100'} border rounded-3xl p-5 w-full shadow-sm`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{commenterName}</span>
                    {isHost && <span className="text-[#ea580c] bg-orange-100 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md">HOST</span>}
                  </div>
                  <span className="text-xs font-medium text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{comment.comment}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input box bottom */}
      <div className="pt-8 flex justify-center">
        <div className="w-full flex items-center bg-white rounded-full border border-gray-200 p-2 shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#ea580c]/20 focus-within:border-[#ea580c] transition-all">
          <input 
            type="text" 
            placeholder="Write a reply..." 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            disabled={commentMutation.isPending}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 px-4"
          />
          <button 
            onClick={handleComment}
            disabled={!commentText.trim() || commentMutation.isPending}
            className="bg-[#ea580c] hover:bg-[#c2410a] disabled:opacity-50 text-white p-3 rounded-full transition-colors flex items-center justify-center shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
