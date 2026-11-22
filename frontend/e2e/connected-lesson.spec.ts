import {expect,test} from '@playwright/test'

test('contact before booking, exchange a lesson message and share a video link',async({browser,request})=>{
  test.setTimeout(90000)
  const base=process.env.SKILLBOOK_TEST_API
  if(!base)throw new Error('Run using ConnectedLessonBrowserTest with the H2 test profile')
  const register=async(role:string)=>{
    const res=await request.post(`${base}/auth/register`,{data:{
      email:`${crypto.randomUUID()}@example.org`,role,name:`Test ${role}`,password:'ExampleLesson123!'
    }})
    expect(res.status()).toBe(201)
    return (await res.json()).data
  }
  const tutor=await register('TUTOR'),student=await register('STUDENT')
  const headers={Authorization:`Bearer ${tutor.token}`}
  expect((await request.put(`${base}/tutors/profile`,{headers,data:{bio:'English conversation',hourlyRate:20}})).ok()).toBeTruthy()
  expect((await request.put(`${base}/tutors/profile/skills`,{headers,data:{skills:['English']}})).ok()).toBeTruthy()
  const start=new Date(Date.now()+172800000)
  expect((await request.post(`${base}/tutors/availability/slots`,{headers,data:{
    startAt:start.toISOString(),endAt:new Date(start.getTime()+3600000).toISOString()}})).ok()).toBeTruthy()
  const studentPage=await browser.newPage(),tutorPage=await browser.newPage()
  for(const [page,account] of [[studentPage,student],[tutorPage,tutor]] as const){
    await page.goto('/login')
    await page.getByLabel('Email',{exact:true}).fill(account.user.email)
    await page.getByLabel('Password',{exact:true}).fill('ExampleLesson123!')
    await page.getByRole('button',{name:'Sign In',exact:true}).click()
    await expect(page).not.toHaveURL(/\/login$/)
  }
  await tutorPage.goto('/account')
  await tutorPage.getByLabel('Profile photo').setInputFiles('public/images/lesson.jpg')
  await expect(tutorPage.getByText('Photo saved.')).toBeVisible()
  await tutorPage.getByLabel('Tutor introduction video URL').fill('https://example.org/intro.mp4')
  await tutorPage.getByRole('button',{name:'Save video'}).click()
  await expect(tutorPage.getByText('Intro video saved.')).toBeVisible()
  const profile=`/tutors/${tutor.user.id}`
  const visitor=await browser.newPage()
  await visitor.goto(profile)
  await expect(visitor.getByRole('heading',{name:'Test TUTOR',exact:true})).toBeVisible()
  await expect(visitor.getByRole('button',{name:'Sign in to book'})).toBeVisible()
  await visitor.close()
  await studentPage.goto('/discover')
  await studentPage.getByText('Match tutors to my learning goals',{exact:true}).click()
  await studentPage.getByLabel('Skills I want to learn').fill('English, Physics')
  await studentPage.getByRole('button',{name:'Find matches',exact:true}).click()
  await expect(studentPage.getByRole('link',{name:'Test TUTOR · 1 of 2 goals matched'})).toBeVisible()
  await studentPage.reload()
  await studentPage.getByText('Match tutors to my learning goals',{exact:true}).click()
  await expect(studentPage.getByLabel('Skills I want to learn')).toHaveValue('English, Physics')
  await expect(studentPage.getByRole('link',{name:'Test TUTOR · 1 of 2 goals matched'})).toBeVisible()
  await studentPage.getByRole('link',{name:"View Test TUTOR's profile"}).click()
  await expect(studentPage.locator('video')).toHaveAttribute('src','https://example.org/intro.mp4')
  await expect.poll(()=>studentPage.locator('.profile-panel img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
  await studentPage.getByRole('link',{name:'Message tutor'}).click()
  await studentPage.getByLabel('Your message').fill('Can we practise introductions?')
  await studentPage.getByRole('button',{name:'Send message'}).click()
  await tutorPage.goto('/inbox')
  await tutorPage.getByRole('button',{name:/Test STUDENT/}).click()
  await expect(tutorPage.getByText('Can we practise introductions?')).toBeVisible()
  await studentPage.goto(profile)
  await studentPage.getByRole('button',{name:'Book',exact:true}).click()
  await expect(studentPage).toHaveURL(/\/bookings$/)
  await tutorPage.goto('/bookings')
  for(const page of [tutorPage,studentPage]){
    await page.getByRole('button',{name:'Chat',exact:true}).click()
    await expect(page.getByText(/Live updates/)).toBeVisible()
  }
  await tutorPage.getByLabel('Your message').fill('See you at the lesson!')
  await tutorPage.getByRole('button',{name:'Send message'}).click()
  await expect(studentPage.getByText('See you at the lesson!')).toBeVisible()
  await tutorPage.getByText('Add lesson link',{exact:true}).click()
  const meeting='https://zoom.us/j/123456789'
  await tutorPage.getByLabel('Zoom or Google Meet URL').fill(meeting)
  await tutorPage.getByRole('button',{name:'Share lesson link'}).click()
  await expect(tutorPage.getByText('Link shared with the student.')).toBeVisible()
  await studentPage.reload()
  await expect(studentPage.getByRole('link',{name:'Join video lesson'})).toHaveAttribute('href',meeting)
  await studentPage.getByRole('button',{name:'Sign out'}).click()
  await expect(studentPage).toHaveURL(/\/login$/)
  await Promise.all([studentPage.close(),tutorPage.close()])
})
