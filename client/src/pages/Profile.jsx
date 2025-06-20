/* eslint-disable no-useless-catch */
/* eslint-disable no-unused-vars */
// import React from 'react'
import {app} from '../firebase.js'
import { useRef, useState, useEffect } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

import {useNavigate} from 'react-router';
import {Link} from 'react-router-dom';
import { updateFailure,updateStart,updateSuccess,
  deleteUserFailure,deleteUserStart,deleteUserSuccess,
  signOutUserFailure,signOutUserStart,signOutUserSuccess } from '../redux/user/userSlice.js';
import { useSelector,useDispatch } from 'react-redux';

function Profile() {
  const {currentUser , loading, error} = useSelector((state) => state.user)
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [userUpadted, setUserUpadted] = useState(false)
  const [userListings,setUserListings] = useState([])
  const [showListingsError,setShowListingsError] = useState(false)
  const fileRef = useRef()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  useEffect(() => {
    let timeoutId;
    if (userUpadted) {
      timeoutId = setTimeout(() => {
        setUserUpadted(false); 
      }, 2000); 
    }

    return () => clearTimeout(timeoutId);
  }, [userUpadted]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData({ ...formData, avatar: downloadURL })
        );
        console.log("done url downloading")
      }
    );
  }

  const handleInput = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleSubmit = async(e) => {
    e.preventDefault()
    try {
      updateStart()
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/update/${currentUser._id}`,{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({...formData})
      })

      const data = await res.json()
      if(data.success===false){
        dispatch(updateFailure(data.message))
        return ;
      }

      document.getElementById('password').value=''
      dispatch(updateSuccess(data))
      setUserUpadted(true)
    } catch (error) {
      dispatch(updateFailure(error.message))
    }
  }

  const handleDeleteUser = async() => {
    try {
      dispatch(deleteUserStart())
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/delete/${currentUser._id}`,{
        method: 'DELETE',
      })

      const data = await res.json()
      if(data.success === false){
        dispatch(deleteUserFailure(data.message))
        return ;
      }

      dispatch(deleteUserSuccess())
      navigate('/login')
    } catch (error) {
      dispatch(deleteUserFailure(error.message))
    }
  }

  const handleSignOutUser = async() => {
    try {
      dispatch(signOutUserStart())
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signout`)

      const data = await res.json()
      if(data.success === false){
        dispatch(signOutUserFailure(data.message))
        return ;
      }

      dispatch(signOutUserSuccess())
      navigate('/login')
    } catch (error) {
      dispatch(signOutUserFailure(error.message))
    }
  }

  const handleShowListings = async() =>{
    try {
      setShowListingsError(false)
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/getuserlistings/${currentUser._id}`)

      const data = await res.json()
      if(data.success === false){
        setShowListingsError(true)
        return ;
      }

      setUserListings(data)
    } catch (error) {
      setShowListingsError(true)
    }
  }

  const handleListingDelete = async(id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/listing/delete/${id}`,{
        method: 'DELETE',
      })

      const data = await res.json()

      if(res.success===false){
        console.log(res.message)
      }

      setUserListings((prev) => prev.filter((list) => list._id!==id))
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          onChange={(e) => setFile(e.target.files[0])}
          type='file'
          ref={fileRef}
          hidden
          accept='image/*'
        />
        <img
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser.avatar}
          alt='profile'
          className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2'
        />
        <p className='text-sm self-center'>
          {fileUploadError ? (
            <span className='text-red-700'>
              Error Image upload (image must be less than 2 mb)
            </span>
          ) : filePerc > 0 && filePerc < 100 ? (
            <span className='text-slate-700'>{`Uploading ${filePerc}%`}</span>
          ) : filePerc === 100 ? (
            <span className='text-green-700'>Image successfully uploaded!</span>
          ) : (
            ''
          )}
        </p>
        <input
          onChange={handleInput}
          type='text'
          placeholder='username'
          defaultValue={currentUser.username}
          id='username'
          className='border p-3 rounded-lg'
        />
        <input
          onChange={handleInput}
          type='email'
          placeholder='email'
          id='email'
          defaultValue={currentUser.email}
          className='border p-3 rounded-lg'
        />
        <input
          onChange={handleInput}
          type='password'
          placeholder='password'
          id='password'
          className='border p-3 rounded-lg'
        />
        <button
          disabled={loading}
          className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Update'}
        </button>
        <Link to='/create-listing' className='bg-green-700 text-white text-center rounded-lg uppercase p-3 hover:opacity-95 '>
          Create Listing
        </Link>
      </form>
      <div className='flex justify-between mt-5'>
        <span onClick={handleDeleteUser} className='text-red-700 cursor-pointer'>
          Delete account
        </span>
        <span onClick={handleSignOutUser} className='text-red-700 cursor-pointer'>
          Sign out
        </span>
      </div>
      <p className='text-red-700 mt-5 text-center'>{error ? error : ''}</p>
      <p className='text-green-700 mt-5 text-center'>
        {userUpadted ? 'User is updated successfully!' : ''}
      </p>

      <button onClick={handleShowListings} className='text-green-700 w-full'>
        Show Listings
      </button>
      <p className='text-red-700 mt-5'>
        {showListingsError ? 'Error showing listings' : ''}
      </p>

      {/* {userListings && userListings.length==0 && (
        <p className='text-red-700 mt-5'>
          you currently have no listing 
        </p>
      )} */}

      {userListings && userListings.length > 0 && (
        <div className='flex flex-col gap-4'>
          <h1 className='text-center mt-7 text-2xl font-semibold'>
            Your Listings
          </h1>
          {userListings.map((listing) => (
            <div
              key={listing._id}
              className='border rounded-lg p-3 flex justify-between items-center gap-4'
            >
              <Link to={`/listing/${listing._id}`}>
                <img
                  src={listing.imageUrls[0]}
                  alt='listing cover'
                  className='h-16 w-16 object-contain'
                />
              </Link>
              <Link
                className='text-slate-700 font-semibold  hover:underline truncate flex-1'
                to={`/listing/${listing._id}`}
              >
                <p>{listing.name}</p>
              </Link>

              <div className='flex flex-col item-center'>
                <button
                  onClick={() => handleListingDelete(listing._id)}
                  className='text-red-700 uppercase'
                >
                  Delete
                </button>
                <Link to={`/update-listing/${listing._id}`}>
                  <button className='text-green-700 uppercase'>Edit</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Profile
