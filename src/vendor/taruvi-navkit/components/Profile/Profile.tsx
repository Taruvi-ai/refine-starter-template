import { Box, SvgIcon } from '@mui/material'
import { getProfileStyles } from './Profile.styles'
import { useNavigation } from '../../NavkitContext'

const ProfileIcon = ({ color }: { color?: string }) => (
    <SvgIcon viewBox="0 0 22 22" sx={{ fontSize: 23, display: 'block' }}>
        <path d="M10.9921 20.9849C16.511 20.9849 20.9849 16.511 20.9849 10.9921C20.9849 5.4732 16.511 0.999268 10.9921 0.999268C5.47322 0.999268 0.999283 5.4732 0.999283 10.9921C0.999283 16.511 5.47322 20.9849 10.9921 20.9849Z" stroke={color || "#9DE5FD"} fill="none" strokeWidth="1.99856" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.9921 11.9914C12.6478 11.9914 13.9899 10.6492 13.9899 8.99357C13.9899 7.33791 12.6478 5.99573 10.9921 5.99573C9.33644 5.99573 7.99426 7.33791 7.99426 8.99357C7.99426 10.6492 9.33644 11.9914 10.9921 11.9914Z" stroke={color || "#9DE5FD"} fill="none" strokeWidth="1.99856" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.99569 19.6479V17.9871C5.99569 17.457 6.20625 16.9487 6.58106 16.5739C6.95586 16.1991 7.4642 15.9885 7.99425 15.9885H13.9899C14.52 15.9885 15.0283 16.1991 15.4031 16.5739C15.7779 16.9487 15.9885 17.457 15.9885 17.9871V19.6479" stroke={color || "#9DE5FD"} fill="none" strokeWidth="1.99856" strokeLinecap="round" strokeLinejoin="round"/>
    </SvgIcon>
)

import type { UserData } from '../../types'

interface ProfileProps {
    userData: UserData
    onClick: () => void
    iconColor?: string
}

const Profile = (props: ProfileProps) => {
    const { userData, onClick, iconColor } = props
    const { themeMode } = useNavigation()
    const styles = getProfileStyles(themeMode)

    return (
        <Box sx={styles.trigger} onClick={onClick}>
            {userData.icon_url ? (
                <Box component="img" src={userData.icon_url} sx={{ width: 23, height: 23, borderRadius: '50%' }} />
            ) : (
                <ProfileIcon color={iconColor} />
            )}
        </Box>
    )
}

export default Profile
