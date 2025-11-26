'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettingsForm } from './profile-settings-form'
import { PrivacySettingsForm } from './privacy-settings-form'

interface SettingsTabsProps {
  user: {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
    profileVisibility: string
    reviewVisibility: string
  }
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="profile">프로필 정보</TabsTrigger>
        <TabsTrigger value="privacy">개인정보 설정</TabsTrigger>
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
    </Tabs>
  )
}
