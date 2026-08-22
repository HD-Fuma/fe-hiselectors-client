import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'
import { navigate } from '../../navigation'
import { useShopDemo } from './ShopDemoContext'

export default function ProfileEditScreen() {
  const { profile, setStatus, updateProfile } = useShopDemo()
  const [name, setName] = useState(profile.name)
  const [avatarImage, setAvatarImage] = useState(profile.avatarImage ?? '')
  const formRef = useRef<HTMLFormElement>(null)
  const trimmedName = name.trim()
  const canSave = trimmedName.length > 0 && trimmedName.length <= 20

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setAvatarImage(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    updateProfile(trimmedName, avatarImage)
    setStatus('프로필을 수정했어요.')
    navigate('/shop/groups')
  }

  return (
    <div className="panel-page">
      <ScreenHeader backHref="/shop/groups" title="프로필 수정" />
      <div className="screen-scroll shop-profile-edit-screen">
        <form onSubmit={handleSubmit} ref={formRef}>
          <section className="profile-image-editor">
            <div className="profile-image-preview">
              {avatarImage ? <img alt="프로필 미리보기" src={avatarImage} /> : <span aria-hidden="true" />}
            </div>
            <label className="profile-image-button">
              사진 변경
              <input accept="image/*" onChange={handleImage} type="file" />
            </label>
            {avatarImage ? <button onClick={() => setAvatarImage('')} type="button">기본 이미지로</button> : null}
          </section>
          <section className="profile-name-editor">
            <label className="field-label" htmlFor="selector-profile-name">셀렉터스 닉네임</label>
            <input
              id="selector-profile-name"
              maxLength={20}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <span>{name.length} / 20</span>
          </section>
        </form>
      </div>
      <BottomActionBar disabled={!canSave} label="저장하기" onClick={() => formRef.current?.requestSubmit()} />
    </div>
  )
}
