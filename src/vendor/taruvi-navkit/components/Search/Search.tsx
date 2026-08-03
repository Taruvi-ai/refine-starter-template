import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TextField, InputAdornment } from '@mui/material'
import { useState } from 'react'
import { getSearchStyles } from './Search.styles'
import { useNavigation } from '../../NavkitContext'
import type { AppData } from '../../types'

interface SearchProps {
  appsList?: AppData[]
  onSearchChange?: (filteredApps: AppData[]) => void
}

const Search = ({ appsList, onSearchChange }: SearchProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { themeMode } = useNavigation()
  const styles = getSearchStyles(themeMode)

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)

    // Filter apps based on search term
    if (appsList) {
      const filtered = value.trim() === ''
        ? appsList
        : appsList.filter(app =>
            app.appname.toLowerCase().includes(value.toLowerCase())
          )

      // Call parent callback with filtered results
      onSearchChange?.(filtered)
    }
  }

  return (
    <TextField
      fullWidth
      placeholder="Search for apps"
      variant="outlined"
      value={searchTerm}
      onChange={handleSearchChange}
      sx={styles.textField}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FontAwesomeIcon icon={["fas", "magnifying-glass"]} style={styles.iconStyle} />
          </InputAdornment>
        ),
      }}
    />
  )
}

export default Search