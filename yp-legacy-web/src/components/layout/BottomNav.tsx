import { NavLink } from 'react-router-dom'

const pill = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-5 py-2.5 rounded-full font-label-md text-label-md transition-all duration-200 ${
    isActive
      ? 'bg-secondary-container text-on-secondary-container shadow-sm font-bold'
      : 'hover:bg-surface-container-high text-on-surface-variant hover:text-primary font-semibold'
  }`

export function BottomNav() {
  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50 px-4">
      <nav className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-2 rounded-full shadow-xl flex items-center gap-2">
        <NavLink to="/profile" className={pill}>
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                person
              </span>
              Profile
            </>
          )}
        </NavLink>
        <NavLink to="/map" className={pill}>
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                location_on
              </span>
              Map
            </>
          )}
        </NavLink>
        <NavLink to="/trees" className={pill}>
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                park
              </span>
              Trees
            </>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
