'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettingsForm } from './profile-settings-form'
import { PrivacySettingsForm } from './privacy-settings-form'
import { AccountManagementForm } from './account-management-form'

interface SettingsTabsProps {
  user: {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
    bio: string | null
    preferredPlatform: string | null
    profileVisibility: string
    reviewVisibility: string
  }
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="profile">프로필 정보</TabsTrigger>
        <TabsTrigger value="privacy">개인정보 설정</TabsTrigger>
        <TabsTrigger value="account">계정 관리</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettingsForm user={user} />
      </TabsContent>

      <TabsContent value="privacy">
        <PrivacySettingsForm
          profileVisibility={user.profileVisibility}
          reviewVisibility={user.reviewVisibility}
        />
      </TabsContent>

      <TabsContent value="account">
        <AccountManagementForm user={user} />
      </TabsContent>
    </Tabs>
  )
}
