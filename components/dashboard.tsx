"use client"

import { useEffect, useState } from "react"
import DashboardPage from "@/app/dashboard/dashboard-page"
import GradientSpinnerSVG from "./dashboard/gradientSpinner"

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    const handleLoading = () => {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    }

    handleLoading()
  }, [])

  return (
    <>
      {isLoading ? (
        <GradientSpinnerSVG />
      ) : (
        <DashboardPage />
      )}
    </>
  )
}

export default Dashboard