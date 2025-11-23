'use client'

import { useState } from 'react'
import { Settings, Palette, Users, MessageSquare } from 'lucide-react'
import { CommunityBasicSettingsForm } from './community-basic-settings-form'
import { CommunityImageSettings } from './community-image-settings'
import { MemberManagement } from './member-management'
import { BoardManagement } from './board-management'

interface Community {
  id: string
  name: string
  description: string | null
  image: string | null
}

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    email: string
  }
}

interface CommunityManagementTabsProps {
  community: Community
  members: Member[]
  ownerId: string
}

type TabType = 'basic' | 'custom' | 'members' | 'posts'

export function CommunityManagementTabs({
  community,
  members,
  ownerId,
}: CommunityManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const tabs = [
    { id: 'basic' as TabType, label: '기본 설정', icon: Settings },
    { id: 'custom' as TabType, label: '커스텀', icon: Palette },
    { id: 'members' as TabType, label: '부원, 부회장 관리', icon: Users },
    { id: 'posts' as TabType, label: '게시판 관리', icon: MessageSquare },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-lg p-6">
        {activeTab === 'basic' && (
          <div>
            <h2 className="text-xl font-bold mb-6">기본 설정</h2>
            <CommunityBasicSettingsForm community={community} />
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
            <h2 className="text-xl font-bold mb-6">커스텀 설정</h2>
            <CommunityImageSettings community={community} />
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h2 className="text-xl font-bold mb-6">부원, 부회장 관리</h2>
            <MemberManagement
              communityId={community.id}
              members={members}
              ownerId={ownerId}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            <h2 className="text-xl font-bold mb-6">게시판 관리</h2>
            <BoardManagement communityId={community.id} />
          </div>
        )}
      </div>
    </div>
  )
}
