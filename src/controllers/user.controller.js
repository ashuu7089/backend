import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUploader.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshtoken =  await user.generateRefreshToken();
    user.refreshtoken = refreshtoken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshtoken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access or refresh token"
    );
  }
};

// API for register User
const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;

  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email and user name already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImgLocalPath = req.files?.coverImg[0]?.path;
  let coverImgLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.length > 0
  ) {
    coverImgLocalPath = req.files.coverImg[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required ");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImg = await uploadOnCloudinary(coverImgLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
    email,
    password,
    fullName,
  });

  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!checkUser) {
    throw new ApiError(
      500,
      "Something went wrong while registration the user "
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, checkUser, "User registred successfully"));
});

// API for login
const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "userName or email is required");
  }
  const findUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!findUser) {
    throw new ApiError(404, "User do not exists");
  }
  const isPasswordValid = await findUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User credential");
  }
  const { accessToken, refreshtoken } = await generateAccessAndRefreshToken(
    findUser._id
  );
  
  const loggedInUser = await User.findById(findUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshtoken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshtoken },
        "User login successfully"
      )
    );
});

// API logout User
const logoutUser = asyncHandler(async (req, res) => {
  // const user = req.user._id;
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshtoken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

// API For IncomingAccessToken
const accessRefreshToken = asyncHandler(async (req, res)=> {
  try {
    const IncomingRefreshToken = req.cookies.refreshToken ||  req.body.refreshToken;
    if(!IncomingRefreshToken){
      throw new ApiError(401, "Unauthorized request")
    }
   const decodedToken =  jwt.verify(IncomingRefreshToken, process.env.REFRESH_TOKEN)
    const user = await User.findById(decodedToken._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
    if(IncomingRefreshToken !==   user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used ")
    }
    const options = {
      httpOnly : true,
      secure : true,
    }
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    return res.status(200).cookie("access token", accessToken, options)
    .cookie("refresh token", newrefreshToken, options)
    .json(
      new ApiResponse(200,
        {
          accessToken, refreshToken : newrefreshToken
        },
        "Access token refreshed "
      )
    )
  } catch (error) {
    throw new ApiError(500, error?.message || "Invalid refresh token")
  }
})

// API for changeCurrent Password
const changeCurrentPassword = asyncHandler( async(req, res)=> {
  const { oldPassword, newPassword } = req.body;
  const findUser = await User.findById(req.user?.id)
  const isPasswordCorrect = await findUser.isPasswordCorrect()
  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old Password")
  }
  findUser.password = newPassword;
  await findUser.save({ validateBeforeSave : false })
  return res.status(200)
  .json(
    new ApiResponse(200, {}, "Password changed successfully")
  )
})

// API for fetchCurrent User
const getCurrentUser = asyncHandler( async(req, res)=> {
  return res.status(200).json(
    new ApiResponse(200, req.user, " get current Data successfully")
  )
})

// API for update user data
const updateUserData = asyncHandler(async(req, res)=> {
  const { fullName, email } = req.body;
  if(!fullName || !email) {
    throw new ApiError(400, "please provide a fullName and email")
  }
  const findUser = await User.findByIdAndUpdate(req.user._id, {
    $set : {
      fullName : fullName,
      email : email
    }
  },{
    new :true
  })
  return res.status(200).json(
    new ApiResponse(200, {}, " user channel data fetched successfully")
  )
})

// Api for updatUserAvatar
const updateUserAvatarData = asyncHandler(async(req, res)=> {
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(400, "Error while uploading on avatar")
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set  :{
      avatar : avatar.url
    }
  },{
    new : true
  }).select('-password')
  return res.status(200).json(
    new ApiResponse( 200, user, "Cover image update successfully")
  )
})

// API for cover image avatar
const updateUserCoverImgData = asyncHandler(async(req, res)=> {
  const coverImgPath = req.file?.path
  if(!coverImgPath){
    throw new ApiError(400, "Cover Image file is missing")
  }
  const coverImg = await uploadOnCloudinary(coverImgPath)
  if(!coverImg.url){
    throw new ApiError(400, "Error while uploading on coverImg")
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set  :{
      coverImg : coverImg.url
    }
  },{
    new : true
  }).select('-password')
  return res.status(200).json(
    new ApiResponse( 200, user, "Cover image update successfully")
  )
})

const getUserChannelProfile = asyncHandler( async(req, res)=> {
  const { userName } = req.params;
  if(!userName?.trim()){
    throw new ApiError(400, "userName is misssing")
  }
  const channel = await User.aggregate([
    {
      $match : {
        userName : userName?.toLowerCase()
      }
    },
    {
      $lookup : {
        from : "subcriptions",
        localField : '_id',
        foreignField : channel,
        as : "subcribers"
      }
    },
    {
      $lookup : {
        from : "subcriptions",
        localField : '_id',
        foreignField : 'subcriber',
        as : "subcribedTo"
      }
    },{
      $addFields : {
        subcribersCount :{
          $size : "$subcribers"
        },
        channelsSubcribedToCount : {
          $size : "subcribedTo"
        },
        isSubcribed : {
          $cond : {
            if: {$in: [req.user?._id, "$subcribers.subcriber"]},
            then : true,
            else : false
          }
        }
      }
    },{
      $project : {
        fullName : 1,
        userName : 1,
        subcribersCount :1,
        channelsSubcribedToCount : 1,
        isSubcribed :1,
        avatar : 1,
        coverImg : 1
      }
    }
  ])
  console.log(channel);
  if(!channel){
    throw new ApiError(400, "channel does not exists")
  }
  return res.status(200).json(
    new ApiResponse(200, channel, " user channel data fetched successfully")
  )
})

export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  accessRefreshToken, 
  getCurrentUser, 
  updateUserAvatarData, 
  updateUserData,
  updateUserCoverImgData,
  changeCurrentPassword,
  getUserChannelProfile 
};
